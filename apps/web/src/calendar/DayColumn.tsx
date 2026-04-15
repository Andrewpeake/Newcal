import {
  type Event,
  clipEventToDayColumn,
  contentYFromMinutesFromDayStart,
  DEFAULT_DISPLAY_TIMEZONE,
  durationMinutesFromUtcSpan,
  eventId,
  getDayColumnBoundsUtc,
  layoutSingleDayColumn,
  minutesFromMidnightForUtcInZone,
  utcInstantAtMinutesOnCalendarDay,
  utcInstantMs,
} from '@newcal/core';
import { useCallback, useRef, useState, type RefObject } from 'react';

import {
  EVENT_MOVE_THRESHOLD_PX,
  GRID_DRAG_THRESHOLD_PX,
  MIN_EVENT_DURATION_MINUTES,
  minutesFromContentY,
  snapMinutesToGrid,
} from './weekConstants.js';
import { SCHEDULE_HOURS } from './scheduleHours.js';
import { SEED_CALENDAR_ID, useCalendarStore } from '../store/calendar-store.js';

const ZONE = DEFAULT_DISPLAY_TIMEZONE;

function localYInColumn(columnEl: HTMLElement, clientY: number): number {
  const rect = columnEl.getBoundingClientRect();
  return clientY - rect.top;
}

export type DayColumnProps = {
  dayIndex: number;
  weekMondayUtc: number;
  weekEvents: Event[];
  weekSnapWeekStart: boolean;
  pixelsPerMinute: number;
  gridHeightPx: number;
  scrollAnchorRef?: RefObject<HTMLDivElement | null>;
  onOpenEvent: (eventId: string) => void;
};

export function DayColumn({
  dayIndex,
  weekMondayUtc,
  weekEvents,
  weekSnapWeekStart,
  pixelsPerMinute,
  gridHeightPx,
  scrollAnchorRef,
  onOpenEvent,
}: DayColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const dispatch = useCalendarStore((s) => s.dispatch);
  const eventsById = useCalendarStore((s) => s.state.eventsById);

  const setColumnEl = useCallback(
    (el: HTMLDivElement | null) => {
      columnRef.current = el;
      if (scrollAnchorRef) {
        scrollAnchorRef.current = el;
      }
    },
    [scrollAnchorRef],
  );

  const { dayStartUtc, dayEndExclusiveUtc } = getDayColumnBoundsUtc(weekMondayUtc, dayIndex, ZONE);

  const clipped: Event[] = [];
  for (const e of weekEvents) {
    const c = clipEventToDayColumn(e, dayStartUtc, dayEndExclusiveUtc);
    if (c) {
      clipped.push(c);
    }
  }

  const placements = layoutSingleDayColumn(clipped);
  const placeById = new Map(placements.map((p) => [p.eventId as string, p]));

  const [draftCreate, setDraftCreate] = useState<null | { startY: number; curY: number }>(null);
  const draftCreateRef = useRef<null | { startY: number; curY: number }>(null);

  const syncDraft = useCallback((next: { startY: number; curY: number } | null) => {
    draftCreateRef.current = next;
    setDraftCreate(next);
  }, []);

  const handleGridPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) {
        return;
      }
      const el = columnRef.current;
      if (!el) {
        return;
      }
      const y = localYInColumn(el, e.clientY);
      if (y < 0 || y > gridHeightPx) {
        return;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      syncDraft({ startY: y, curY: y });
    },
    [gridHeightPx, syncDraft],
  );

  const handleGridPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draftCreateRef.current) {
        return;
      }
      const el = columnRef.current;
      if (!el) {
        return;
      }
      const y = Math.max(0, Math.min(gridHeightPx, localYInColumn(el, e.clientY)));
      const base = draftCreateRef.current;
      syncDraft({ startY: base.startY, curY: y });
    },
    [gridHeightPx, syncDraft],
  );

  const handleGridPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = draftCreateRef.current;
      if (!d) {
        return;
      }
      syncDraft(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      const dy = Math.abs(d.curY - d.startY);
      let aMin: number;
      let durationMin: number;

      if (dy < GRID_DRAG_THRESHOLD_PX) {
        aMin = snapMinutesToGrid(minutesFromContentY(d.startY, pixelsPerMinute));
        durationMin = MIN_EVENT_DURATION_MINUTES;
      } else {
        let a = minutesFromContentY(Math.min(d.startY, d.curY), pixelsPerMinute);
        let b = minutesFromContentY(Math.max(d.startY, d.curY), pixelsPerMinute);
        a = snapMinutesToGrid(a);
        b = snapMinutesToGrid(b);
        aMin = a;
        durationMin = Math.max(MIN_EVENT_DURATION_MINUTES, b - a);
      }

      const maxStartMin = 24 * 60 - MIN_EVENT_DURATION_MINUTES;
      aMin = Math.max(0, Math.min(aMin, maxStartMin));
      const startUtc = utcInstantAtMinutesOnCalendarDay(dayStartUtc, aMin, ZONE);
      const endUtc = utcInstantMs(startUtc + durationMin * 60 * 1000);

      dispatch({
        type: 'createEvent',
        event: {
          id: eventId(crypto.randomUUID()),
          calendarId: SEED_CALENDAR_ID,
          title: 'New event',
          startUtc,
          endUtc,
          displayTimeZone: ZONE,
        },
      });
    },
    [dayStartUtc, dispatch, pixelsPerMinute, syncDraft],
  );

  const handleGridPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      syncDraft(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [syncDraft],
  );

  const attachMoveListeners = useCallback(
    (originClientY: number, origStartUtc: number, eid: string) => {
      let moved = false;

      const onMove = (ev: PointerEvent) => {
        if (Math.abs(ev.clientY - originClientY) > EVENT_MOVE_THRESHOLD_PX) {
          moved = true;
        }
      };

      const onUp = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (!moved) {
          onOpenEvent(eid);
          return;
        }
        const deltaPx = ev.clientY - originClientY;
        const deltaMin = snapMinutesToGrid(deltaPx / pixelsPerMinute);
        const newStart = utcInstantMs(origStartUtc + deltaMin * 60 * 1000);
        dispatch({ type: 'moveEvent', eventId: eventId(eid), newStartUtc: newStart });
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [dispatch, onOpenEvent, pixelsPerMinute],
  );

  const attachResizeListeners = useCallback(
    (edge: 'start' | 'end', eid: string) => {
      const onMove = (ev: PointerEvent) => {
        ev.preventDefault();
      };

      const onUp = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);

        const el = columnRef.current;
        const full = useCalendarStore.getState().state.eventsById[eid];
        if (!el || !full) {
          return;
        }
        const y = Math.max(0, Math.min(gridHeightPx, localYInColumn(el, ev.clientY)));
        const m = snapMinutesToGrid(minutesFromContentY(y, pixelsPerMinute));
        const candidate = utcInstantAtMinutesOnCalendarDay(dayStartUtc, m, ZONE);
        const minDurMs = MIN_EVENT_DURATION_MINUTES * 60 * 1000;

        if (edge === 'start') {
          const maxStart = full.endUtc - minDurMs;
          const startMs = Math.min(candidate as number, maxStart);
          if (startMs < full.endUtc) {
            dispatch({
              type: 'resizeEvent',
              eventId: eventId(eid),
              edge: 'start',
              newUtc: utcInstantMs(startMs),
            });
          }
        } else {
          const minEnd = full.startUtc + minDurMs;
          const endMs = Math.max(candidate as number, minEnd);
          if (endMs > full.startUtc) {
            dispatch({
              type: 'resizeEvent',
              eventId: eventId(eid),
              edge: 'end',
              newUtc: utcInstantMs(endMs),
            });
          }
        }
      };

      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [dayStartUtc, dispatch, gridHeightPx, pixelsPerMinute],
  );

  let draftPreview: { top: number; height: number } | null = null;
  if (draftCreate) {
    const topPx = Math.min(draftCreate.startY, draftCreate.curY);
    const botPx = Math.max(draftCreate.startY, draftCreate.curY);
    draftPreview = {
      top: topPx,
      height: Math.max(botPx - topPx, 2),
    };
  }

  const columnClass = weekSnapWeekStart ? 'day-column week-snap-week-start' : 'day-column';

  return (
    <div ref={setColumnEl} className={columnClass} style={{ minHeight: gridHeightPx }}>
      <div className="day-hour-lines" aria-hidden>
        {SCHEDULE_HOURS.map((h) => (
          <div
            key={h}
            className="day-hour-line"
            style={{
              top: contentYFromMinutesFromDayStart({
                minutesFromDayStart: h * 60,
                pixelsPerMinute,
              }),
            }}
          />
        ))}
      </div>
      <div
        className="day-grid-interaction"
        style={{ height: gridHeightPx }}
        onPointerDown={handleGridPointerDown}
        onPointerMove={handleGridPointerMove}
        onPointerUp={handleGridPointerUp}
        onPointerCancel={handleGridPointerCancel}
      />
      {draftPreview ? (
        <div
          className="day-create-preview"
          style={{
            top: draftPreview.top,
            height: draftPreview.height,
          }}
        />
      ) : null}
      <div className="day-events-layer">
        {clipped.map((ev) => {
          const pl = placeById.get(ev.id as string);
          if (!pl) {
            return null;
          }
          const full = eventsById[ev.id as string];
          if (!full) {
            return null;
          }
          const startMin = minutesFromMidnightForUtcInZone(ev.startUtc, ZONE);
          const durMin = durationMinutesFromUtcSpan(ev.startUtc, ev.endUtc);
          const topPx = contentYFromMinutesFromDayStart({
            minutesFromDayStart: startMin,
            pixelsPerMinute,
          });
          const heightPx = durMin * pixelsPerMinute;

          const showTopHandle = full.startUtc >= dayStartUtc;
          const showBottomHandle = full.endUtc <= dayEndExclusiveUtc;

          return (
            <div
              key={ev.id as string}
              className="week-event-block"
              title={ev.title}
              style={{
                top: topPx,
                height: Math.max(heightPx, 4),
                left: `${(100 * pl.columnIndex) / pl.columnCount}%`,
                width: `${100 / pl.columnCount}%`,
              }}
            >
              {showTopHandle ? (
                <div
                  className="week-event-resize week-event-resize--top"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (e.button !== 0) {
                      return;
                    }
                    e.preventDefault();
                    attachResizeListeners('start', ev.id as string);
                  }}
                />
              ) : null}
              <div
                className="week-event-body"
                onPointerDown={(e) => {
                  if (e.button !== 0) {
                    return;
                  }
                  e.stopPropagation();
                  attachMoveListeners(e.clientY, full.startUtc, ev.id as string);
                }}
              >
                <span className="week-event-title">{ev.title}</span>
              </div>
              {showBottomHandle ? (
                <div
                  className="week-event-resize week-event-resize--bottom"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (e.button !== 0) {
                      return;
                    }
                    e.preventDefault();
                    attachResizeListeners('end', ev.id as string);
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
