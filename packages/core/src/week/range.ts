import { DateTime } from 'luxon';

import { DEFAULT_DISPLAY_TIMEZONE } from '../time/iana.js';
import type { IanaTimeZoneId } from '../time/iana.js';
import { utcInstantMs, type UtcInstantMs } from '../time/utc-instant.js';

import { WEEK_VISIBLE_DAYS } from './config.js';

export type IsoWeekRangeUtc = {
  /** Monday 00:00 local in `zone`, as UTC instant. */
  weekStartUtc: UtcInstantMs;
  /** Next Monday 00:00 local (exclusive end for range queries). */
  weekEndExclusiveUtc: UtcInstantMs;
};

/**
 * Monday-start ISO week containing `anchorUtcMs`, interpreted in `zone`.
 */
export function getIsoWeekRangeUtc(
  anchorUtcMs: number,
  zone: IanaTimeZoneId = DEFAULT_DISPLAY_TIMEZONE,
): IsoWeekRangeUtc {
  const d = DateTime.fromMillis(anchorUtcMs, { zone });
  if (!d.isValid) {
    throw new RangeError(`Invalid anchor or zone: ${d.invalidReason}`);
  }
  const monday = d.startOf('day').minus({ days: (d.weekday + 6) % 7 });
  const nextMonday = monday.plus({ weeks: 1 });
  return {
    weekStartUtc: utcInstantMs(monday.toMillis()),
    weekEndExclusiveUtc: utcInstantMs(nextMonday.toMillis()),
  };
}

export type DayColumnBounds = {
  dayStartUtc: UtcInstantMs;
  dayEndExclusiveUtc: UtcInstantMs;
};

/**
 * `dayIndex` 0 = Monday … 6 = Sunday of the week starting at `weekMondayStartUtc` (that Monday 00:00 in `zone`).
 */
export function getDayColumnBoundsUtc(
  weekMondayStartUtc: number,
  dayIndex: number,
  zone: IanaTimeZoneId = DEFAULT_DISPLAY_TIMEZONE,
): DayColumnBounds {
  if (dayIndex < 0 || dayIndex >= WEEK_VISIBLE_DAYS) {
    throw new RangeError(`dayIndex must be 0..${WEEK_VISIBLE_DAYS - 1}`);
  }
  const monday = DateTime.fromMillis(weekMondayStartUtc, { zone }).startOf('day');
  if (!monday.isValid) {
    throw new RangeError(`Invalid week start or zone: ${monday.invalidReason}`);
  }
  const dayStart = monday.plus({ days: dayIndex }).startOf('day');
  const dayEnd = dayStart.plus({ days: 1 });
  return {
    dayStartUtc: utcInstantMs(dayStart.toMillis()),
    dayEndExclusiveUtc: utcInstantMs(dayEnd.toMillis()),
  };
}
