import { DateTime } from 'luxon';

import type { IanaTimeZoneId } from '../time/iana.js';

/**
 * Minutes after local midnight for the calendar day containing `utcMs` in `zone`.
 */
export function minutesFromMidnightForUtcInZone(utcMs: number, zone: IanaTimeZoneId): number {
  const dt = DateTime.fromMillis(utcMs, { zone });
  if (!dt.isValid) {
    throw new RangeError(`Invalid instant or zone: ${dt.invalidReason}`);
  }
  const sod = dt.startOf('day');
  return dt.diff(sod, 'minutes').minutes;
}
