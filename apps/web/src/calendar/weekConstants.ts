import { dayGridHeightPx } from '@newcal/core';

/** Base vertical scale at zoom = 1 (pixels per minute of day). */
export const BASE_PIXELS_PER_MINUTE = 1.25;

/** Base day column width at zoom = 1 (`rem`, matches CSS). */
export const BASE_DAY_COL_REM = 10;

/** One step for toolbar buttons / trackpad pinch proxy. */
export const ZOOM_STEP = 0.1;

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2.5;

/** Snap grid for create, move, and resize (minutes). */
export const SNAP_MINUTES = 15;

/** Minimum span for new events and after resize (minutes). */
export const MIN_EVENT_DURATION_MINUTES = 15;

/** Pixels of movement before a grid pointer counts as a drag (not a click). */
export const GRID_DRAG_THRESHOLD_PX = 6;

/** Ignore tiny moves when distinguishing click vs drag on an event body. */
export const EVENT_MOVE_THRESHOLD_PX = 6;

export function gridHeightFromPixelsPerMinute(pixelsPerMinute: number): number {
  return dayGridHeightPx({ pixelsPerMinute });
}

export function minutesFromContentY(yPx: number, pixelsPerMinute: number): number {
  return yPx / pixelsPerMinute;
}

export function snapMinutesToGrid(minutes: number, step: number = SNAP_MINUTES): number {
  return Math.round(minutes / step) * step;
}
