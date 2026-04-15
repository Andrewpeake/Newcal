import {
  contentYFromMinutesFromDayStart,
  DEFAULT_DISPLAY_TIMEZONE,
  getDayColumnBoundsUtc,
  queryEventsInRange,
} from '@newcal/core';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { DayColumn } from './DayColumn.js';
import { EventEditorModal } from './EventEditorModal.js';
import { formatDayHeading, formatScheduleHour, formatShortDayLabel } from './scheduleFormat.js';
import { SCHEDULE_HOURS } from './scheduleHours.js';
import { todayYmd, weekMondayAndDayIndexFromYmd } from './weekNavigation.js';
import {
  BASE_DAY_COL_REM,
  BASE_PIXELS_PER_MINUTE,
  gridHeightFromPixelsPerMinute,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from './weekConstants.js';
import { useCalendarStore } from '../store/calendar-store.js';

const ZONE = DEFAULT_DISPLAY_TIMEZONE;

function readGutterPx(sc: HTMLElement): number {
  const raw = getComputedStyle(sc).getPropertyValue('--week-gutter-width').trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 48;
}

type ZoomPreserve = {
  centerX: number;
  centerY: number;
  colWOld: number;
  ppmOld: number;
  gutterPx: number;
};

export type DayViewProps = {
  /** `yyyy-MM-dd` in the default display zone. */
  ymd: string;
  onDayChange?: (nextYmd: string) => void;
};

export function DayView({ ymd, onDayChange }: DayViewProps) {
  const state = useCalendarStore((s) => s.state);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const parsed = weekMondayAndDayIndexFromYmd(ymd);
  const pixelsPerMinute = BASE_PIXELS_PER_MINUTE * zoom;
  const gridHeightPx = gridHeightFromPixelsPerMinute(pixelsPerMinute);
  const dayColRem = BASE_DAY_COL_REM * zoom;

  const bounds = parsed ? getDayColumnBoundsUtc(parsed.weekMondayUtc, parsed.dayIndex, ZONE) : null;
  const weekMondayUtc = parsed?.weekMondayUtc;
  const dayIndex = parsed?.dayIndex ?? 0;
  const dayStartUtc = bounds?.dayStartUtc;
  const dayEndExclusiveUtc = bounds?.dayEndExclusiveUtc;

  const dayEvents =
    bounds && dayStartUtc !== undefined && dayEndExclusiveUtc !== undefined
      ? queryEventsInRange(state, {
          startUtc: dayStartUtc,
          endUtc: dayEndExclusiveUtc,
        })
      : [];

  const editingEvent = editingEventId ? state.eventsById[editingEventId] : undefined;

  const biscrollRef = useRef<HTMLDivElement>(null);
  const columnMeasureRef = useRef<HTMLDivElement | null>(null);
  const zoomPreserveRef = useRef<ZoomPreserve | null>(null);

  const applyZoomDelta = useCallback((delta: number) => {
    const sc = biscrollRef.current;
    const col = columnMeasureRef.current;
    if (!sc) {
      return;
    }
    const colWOld = col?.getBoundingClientRect().width ?? 1;
    const gutterPx = readGutterPx(sc);

    setZoom((prev) => {
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + delta));
      if (next === prev) {
        return prev;
      }
      const ppmOld = BASE_PIXELS_PER_MINUTE * prev;
      zoomPreserveRef.current = {
        centerX: sc.scrollLeft + sc.clientWidth / 2,
        centerY: sc.scrollTop + sc.clientHeight / 2,
        colWOld,
        ppmOld,
        gutterPx,
      };
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    const p = zoomPreserveRef.current;
    if (!p) {
      return;
    }
    zoomPreserveRef.current = null;
    const sc = biscrollRef.current;
    const col = columnMeasureRef.current;
    if (!sc || !col || p.colWOld <= 0) {
      return;
    }
    const colWNew = col.getBoundingClientRect().width;
    const ppmNew = BASE_PIXELS_PER_MINUTE * zoom;
    const { centerX, centerY, colWOld, ppmOld, gutterPx } = p;
    const newCX = gutterPx + (centerX - gutterPx) * (colWNew / colWOld);
    const newCY = centerY * (ppmNew / ppmOld);
    const maxL = Math.max(0, sc.scrollWidth - sc.clientWidth);
    const maxT = Math.max(0, sc.scrollHeight - sc.clientHeight);
    sc.scrollLeft = Math.max(0, Math.min(newCX - sc.clientWidth / 2, maxL));
    sc.scrollTop = Math.max(0, Math.min(newCY - sc.clientHeight / 2, maxT));
  }, [zoom]);

  useEffect(() => {
    const el = biscrollRef.current;
    if (!el) {
      return;
    }
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      applyZoomDelta(dir * ZOOM_STEP);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyZoomDelta]);

  const shiftDayBy = useCallback(
    (deltaDays: number) => {
      if (!parsed || dayStartUtc === undefined) {
        return;
      }
      const next = DateTime.fromMillis(Number(dayStartUtc), { zone: ZONE }).plus({ days: deltaDays });
      onDayChange?.(next.startOf('day').toFormat('yyyy-LL-dd'));
    },
    [dayStartUtc, onDayChange, parsed],
  );

  const heading =
    parsed && dayStartUtc !== undefined ? formatDayHeading(dayStartUtc as number) : 'Invalid date';

  return (
    <section className="day-view" aria-label="Day view">
      <div className="week-toolbar">
        <div className="week-toolbar-actions">
          <button type="button" onClick={() => shiftDayBy(-1)} disabled={!parsed}>
            ← Previous day
          </button>
          <button type="button" onClick={() => shiftDayBy(1)} disabled={!parsed}>
            Next day →
          </button>
          <button type="button" onClick={() => onDayChange?.(todayYmd())}>
            Today
          </button>
          <span className="week-toolbar-zoom" aria-hidden>
            |
          </span>
          <button type="button" onClick={() => applyZoomDelta(-ZOOM_STEP)} aria-label="Zoom out">
            −
          </button>
          <span className="week-toolbar-zoom-label" title="Cmd/Ctrl + scroll to zoom">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" onClick={() => applyZoomDelta(ZOOM_STEP)} aria-label="Zoom in">
            +
          </button>
        </div>
        <div className="week-toolbar-meta">
          <p className="week-toolbar-range">{heading}</p>
          <p className="week-toolbar-hint">
            Single-day schedule (same store as Week). Vertical scroll; zoom matches Week view scale behavior.
          </p>
        </div>
      </div>

      {parsed && weekMondayUtc !== undefined ? (
        <div
          ref={biscrollRef}
          className="day-view-biscroll"
          style={{ ['--week-day-col' as string]: `${dayColRem}rem` }}
          role="region"
          aria-label="Day schedule. Scroll vertically for time of day."
        >
          <div className="day-view-biscroll-inner">
            <div className="week-head-row">
              <div className="week-corner" aria-hidden />
              <div className="week-head-days">
                <div className="week-head-cell">
                  {dayStartUtc !== undefined ? formatShortDayLabel(dayStartUtc as number) : ''}
                </div>
              </div>
            </div>
            <div className="week-body-row">
              <div className="time-gutter" style={{ height: gridHeightPx }}>
                {SCHEDULE_HOURS.map((h) => (
                  <div
                    key={h}
                    className="time-gutter-hour"
                    style={{
                      top: contentYFromMinutesFromDayStart({
                        minutesFromDayStart: h * 60,
                        pixelsPerMinute,
                      }),
                    }}
                  >
                    {formatScheduleHour(h)}
                  </div>
                ))}
              </div>
              <div className="week-day-columns">
                <DayColumn
                  dayIndex={dayIndex}
                  weekMondayUtc={weekMondayUtc as number}
                  weekEvents={dayEvents}
                  weekSnapWeekStart
                  pixelsPerMinute={pixelsPerMinute}
                  gridHeightPx={gridHeightPx}
                  scrollAnchorRef={columnMeasureRef}
                  onOpenEvent={(id) => setEditingEventId(id)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="day-view-invalid">Use a valid <code>date</code> query (<code>yyyy-MM-dd</code>).</p>
      )}

      {editingEvent ? (
        <EventEditorModal event={editingEvent} onClose={() => setEditingEventId(null)} />
      ) : null}
    </section>
  );
}
