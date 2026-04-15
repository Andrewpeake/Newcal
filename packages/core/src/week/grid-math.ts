import { MINUTES_PER_DAY } from './config.js';

export type VerticalTimeScale = {
  /** Pixels per one minute of duration (e.g. ~1.25 → ~75px per hour). */
  pixelsPerMinute: number;
};

export function dayGridHeightPx(scale: VerticalTimeScale): number {
  return MINUTES_PER_DAY * scale.pixelsPerMinute;
}

/**
 * Converts a Y offset **within the scrollable day column content** (from the top of the
 * 00:00 line) to minutes after local midnight for that column’s day.
 */
export function minutesFromDayStartFromContentY(params: {
  contentY: number;
  pixelsPerMinute: number;
}): number {
  return params.contentY / params.pixelsPerMinute;
}

export function contentYFromMinutesFromDayStart(params: {
  minutesFromDayStart: number;
  pixelsPerMinute: number;
}): number {
  return params.minutesFromDayStart * params.pixelsPerMinute;
}
