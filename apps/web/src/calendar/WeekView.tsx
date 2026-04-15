import {
  contentYFromMinutesFromDayStart,
  DEFAULT_DISPLAY_TIMEZONE,
  getDayColumnBoundsUtc,
  getIsoWeekRangeUtc,
  queryEventsInRange,
  utcInstantMs,
  WEEK_VISIBLE_DAYS,
} from '@newcal/core';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { DayColumn } from './DayColumn.js';
import { EventEditorModal } from './EventEditorModal.js';
import { formatScheduleHour, formatShortDayLabel } from './scheduleFormat.js';
import { SCHEDULE_HOURS } from './scheduleHours.js';
import {
  BASE_DAY_COL_REM,
  BASE_PIXELS_PER_MINUTE,
  gridHeightFromPixelsPerMinute,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from './weekConstants.js';
import { useCalendarStore } from '../store/calendar-store.js';

const ALIGN_RESIZE_DEBOUNCE_MS = 120;

const ZONE = DEFAULT_DISPLAY_TIMEZONE;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const MS_PER_DAY = MS_PER_WEEK / 7;

function stripRangeCaption(stripStartUtc: number, stripEndExclusiveUtc: number): string {
  const lastDayStartUtc = stripEndExclusiveUtc - MS_PER_DAY;
  return `${formatShortDayLabel(stripStartUtc)} → ${formatShortDayLabel(lastDayStartUtc)}`;
}

function readGutterPx(sc: HTMLElement): number {
  const raw = getComputedStyle(sc).getPropertyValue('--week-gutter-width').trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 48;
}

export type WeekViewProps = {
  weekOffsetWeeks: number;
  onWeekChange?: (next: number) => void;
};

type ZoomPreserve = {
  centerX: number;
  centerY: number;
  colWOld: number;
  ppmOld: number;
  gutterPx: number;
};

export function WeekView({ weekOffsetWeeks, onWeekChange }: WeekViewProps) {
  const state = useCalendarStore((s) => s.state);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const pixelsPerMinute = BASE_PIXELS_PER_MINUTE * zoom;
  const gridHeightPx = gridHeightFromPixelsPerMinute(pixelsPerMinute);
  const dayColRem = BASE_DAY_COL_REM * zoom;

  const anchorMs = Date.now() + weekOffsetWeeks * MS_PER_WEEK;
  const { weekStartUtc } = getIsoWeekRangeUtc(anchorMs, ZONE);
  const prevMonday = utcInstantMs(weekStartUtc - MS_PER_WEEK);
  const nextMonday = utcInstantMs(weekStartUtc + MS_PER_WEEK);
  const stripWeekMondays = [prevMonday, weekStartUtc, nextMonday] as const;

  const stripEndExclusiveUtc = utcInstantMs(nextMonday + MS_PER_WEEK);
  const stripEvents = queryEventsInRange(state, {
    startUtc: prevMonday,
    endUtc: stripEndExclusiveUtc,
  });

  const editingEvent = editingEventId ? state.eventsById[editingEventId] : undefined;

  const biscrollRef = useRef<HTMLDivElement>(null);
  const middleWeekFirstColumnRef = useRef<HTMLDivElement | null>(null);
  const zoomPreserveRef = useRef<ZoomPreserve | null>(null);

  const applyZoomDelta = useCallback((delta: number) => {
    const sc = biscrollRef.current;
    const col = middleWeekFirstColumnRef.current;
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
    const col = middleWeekFirstColumnRef.current;
    if (!sc || !col || p.colWOld <= 0) {
      return;
    }
    const colWNew = col.getBoundingClientRect().width;
    const ppmNew = BASE_PIXELS_PER_MINUTE * zoom;
    const { centerX, centerY, colWOld, ppmOld, gutterPx } = p;
    /** Keep the viewport center anchored in content space (uniform scale on both axes). */
    const newCX = gutterPx + (centerX - gutterPx) * (colWNew / colWOld);
    const newCY = centerY * (ppmNew / ppmOld);
    const maxL = Math.max(0, sc.scrollWidth - sc.clientWidth);
    const maxT = Math.max(0, sc.scrollHeight - sc.clientHeight);
    sc.scrollLeft = Math.max(0, Math.min(newCX - sc.clientWidth / 2, maxL));
    sc.scrollTop = Math.max(0, Math.min(newCY - sc.clientHeight / 2, maxT));
  }, [zoom]);

  /**
   * Align anchor Monday to the left edge of the day area (viewport x = gutter), clamped.
   * `force` — when true (week change), run even if there is no horizontal overflow.
   * Window resize uses `force: false` so we do not fight vertical scrollbar layout unless the strip overflows horizontally.
   */
  useLayoutEffect(() => {
    const sc = biscrollRef.current;
    if (!sc) {
      return;
    }

    const alignAnchorWeekToDayArea = (force: boolean) => {
      const col = middleWeekFirstColumnRef.current;
      if (!col) {
        return;
      }
      if (!force && sc.scrollWidth <= sc.clientWidth + 1) {
        return;
      }
      requestAnimationFrame(() => {
        const gutterPx = readGutterPx(sc);
        const colBox = col.getBoundingClientRect();
        const scBox = sc.getBoundingClientRect();
        const targetLeftViewport = scBox.left + gutterPx;
        const delta = colBox.left - targetLeftViewport;
        let nextScroll = sc.scrollLeft + delta;
        const maxScroll = Math.max(0, sc.scrollWidth - sc.clientWidth);
        nextScroll = Math.max(0, Math.min(nextScroll, maxScroll));
        sc.scrollLeft = nextScroll;
      });
    };

    alignAnchorWeekToDayArea(true);

    let debounceId: ReturnType<typeof setTimeout> | undefined;
    const onWindowResize = () => {
      if (debounceId !== undefined) {
        clearTimeout(debounceId);
      }
      debounceId = setTimeout(() => {
        debounceId = undefined;
        alignAnchorWeekToDayArea(false);
      }, ALIGN_RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener('resize', onWindowResize);
    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (debounceId !== undefined) {
        clearTimeout(debounceId);
      }
    };
  }, [weekOffsetWeeks]);

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

  return (
    <section className="week-view" aria-label="Week view">
      <div className="week-toolbar">
        <div className="week-toolbar-actions">
          <button type="button" onClick={() => onWeekChange?.(weekOffsetWeeks - 1)}>
            ← Previous week
          </button>
          <button type="button" onClick={() => onWeekChange?.(weekOffsetWeeks + 1)}>
            Next week →
          </button>
          <button type="button" onClick={() => onWeekChange?.(0)}>
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
          <p className="week-toolbar-range">{stripRangeCaption(prevMonday, stripEndExclusiveUtc)}</p>
          <p className="week-toolbar-hint">
            Three weeks in one strip—the middle week is in focus. Scroll horizontally (snaps by week) for the week
            before or after. Zoom (toolbar or ⌃/⌘ + scroll) scales hour height and day width together.
          </p>
        </div>
      </div>

      <div
        ref={biscrollRef}
        className="week-biscroll"
        style={{ ['--week-day-col' as string]: `${dayColRem}rem` }}
        role="region"
        aria-label="Week schedule. Scroll vertically for time of day and horizontally for days across multiple weeks."
      >
        <div className="week-biscroll-inner">
          <div className="week-head-row">
            <div className="week-corner" aria-hidden />
            <div className="week-head-days">
              {stripWeekMondays.flatMap((monday, weekIndex) =>
                Array.from({ length: WEEK_VISIBLE_DAYS }, (_, dayIndex) => {
                  const { dayStartUtc } = getDayColumnBoundsUtc(monday, dayIndex, ZONE);
                  return (
                    <div
                      key={`h-${weekIndex}-${dayIndex}`}
                      className={dayIndex === 0 ? 'week-head-cell week-snap-week-start' : 'week-head-cell'}
                    >
                      {formatShortDayLabel(dayStartUtc)}
                    </div>
                  );
                }),
              )}
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
              {stripWeekMondays.flatMap((monday, weekIndex) =>
                Array.from({ length: WEEK_VISIBLE_DAYS }, (_, dayIndex) => (
                  <DayColumn
                    key={`d-${weekIndex}-${dayIndex}`}
                    dayIndex={dayIndex}
                    weekMondayUtc={monday}
                    weekEvents={stripEvents}
                    weekSnapWeekStart={dayIndex === 0}
                    pixelsPerMinute={pixelsPerMinute}
                    gridHeightPx={gridHeightPx}
                    scrollAnchorRef={
                      weekIndex === 1 && dayIndex === 0 ? middleWeekFirstColumnRef : undefined
                    }
                    onOpenEvent={(id) => setEditingEventId(id)}
                  />
                )),
              )}
            </div>
          </div>
        </div>
      </div>

      {editingEvent ? (
        <EventEditorModal event={editingEvent} onClose={() => setEditingEventId(null)} />
      ) : null}
    </section>
  );
}
