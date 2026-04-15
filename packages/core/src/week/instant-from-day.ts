import { DateTime } from 'luxon';

import type { IanaTimeZoneId } from '../time/iana.js';
import { utcInstantMs, type UtcInstantMs } from '../time/utc-instant.js';

import { MINUTES_PER_DAY } from './config.js';

/**
 * Uses the calendar day containing `dayStartUtc` in `zone` (local midnight), then adds
 * `minutesFromMidnight` (clamped to that civil day).
 */
export function utcInstantAtMinutesOnCalendarDay(
  dayStartUtc: number,
  minutesFromMidnight: number,
  zone: IanaTimeZoneId,
): UtcInstantMs {
  const day = DateTime.fromMillis(dayStartUtc, { zone }).startOf('day');
  if (!day.isValid) {
    throw new RangeError(`Invalid day or zone: ${day.invalidReason}`);
  }
  const clamped = Math.max(0, Math.min(minutesFromMidnight, MINUTES_PER_DAY - 1e-6));
  const at = day.plus({ minutes: clamped });
  return utcInstantMs(at.toMillis());
}
