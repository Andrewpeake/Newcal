import { DateTime } from 'luxon';

import type { IanaTimeZoneId } from './iana.js';
import type { UtcInstantMs } from './utc-instant.js';

export type ZonedWallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  /** Minutes offset from UTC (e.g. -360 for MDT). */
  offsetMinutes: number;
};

/**
 * Converts a UTC instant to wall-clock components in `zone` using the IANA TZ database
 * (handles DST). Used for grid labels and modals — not for persisting event bounds.
 */
export function utcToZonedWallClock(instant: UtcInstantMs, zone: IanaTimeZoneId): ZonedWallClock {
  const dt = DateTime.fromMillis(instant, { zone });
  if (!dt.isValid) {
    throw new RangeError(`Invalid instant or IANA zone: ${instant}, ${zone} (${dt.invalidReason})`);
  }
  return {
    year: dt.year,
    month: dt.month,
    day: dt.day,
    hour: dt.hour,
    minute: dt.minute,
    second: dt.second,
    millisecond: dt.millisecond,
    offsetMinutes: dt.offset,
  };
}

/**
 * Returns true if `zone` is recognized by Luxon/IANA for the given instant.
 * Prefer this over accepting arbitrary strings as zones.
 */
export function isValidIanaZone(zone: string, atMillis = 0): boolean {
  const dt = DateTime.fromMillis(atMillis, { zone });
  return dt.isValid;
}
