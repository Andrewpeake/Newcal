import { DateTime } from 'luxon';

import {
  getIsoWeekRangeUtc,
  utcInstantMs,
  DEFAULT_DISPLAY_TIMEZONE,
  type UtcInstantMs,
} from '@newcal/core';

const ZONE = DEFAULT_DISPLAY_TIMEZONE;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Maps a UTC instant to `weekOffsetWeeks` relative to “this week” (same convention as {@link WeekPage}).
 */
export function weekOffsetWeeksFromUtcAnchor(anchorMs: number): number {
  const todayWeekStart = getIsoWeekRangeUtc(Date.now(), ZONE).weekStartUtc as number;
  const targetWeekStart = getIsoWeekRangeUtc(anchorMs, ZONE).weekStartUtc as number;
  return Math.round((targetWeekStart - todayWeekStart) / MS_PER_WEEK);
}

export type WeekMondayDayIndex = {
  weekMondayUtc: UtcInstantMs;
  /** 0 = Monday … 6 = Sunday */
  dayIndex: number;
};

/**
 * Parses `yyyy-MM-dd` in the default display zone. Invalid strings return `null`.
 */
export function weekMondayAndDayIndexFromYmd(ymd: string): WeekMondayDayIndex | null {
  const d = DateTime.fromISO(ymd, { zone: ZONE });
  if (!d.isValid) {
    return null;
  }
  const day = d.startOf('day');
  const monday = day.minus({ days: day.weekday - 1 });
  const dayIndex = Math.round(day.diff(monday, 'days').days);
  if (dayIndex < 0 || dayIndex > 6) {
    return null;
  }
  return {
    weekMondayUtc: utcInstantMs(monday.toMillis()),
    dayIndex,
  };
}

export function ymdFromUtcInZone(ms: number): string {
  return DateTime.fromMillis(ms, { zone: ZONE }).toFormat('yyyy-LL-dd');
}

export function todayYmd(): string {
  return DateTime.now().setZone(ZONE).toFormat('yyyy-LL-dd');
}
