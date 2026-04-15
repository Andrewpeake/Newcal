import type { CalendarId } from '../model/ids.js';
import type { Event } from '../model/event.js';
import type { UtcInstantMs } from '../time/utc-instant.js';
import type { NewcalState } from './types.js';

export type UtcRange = {
  startUtc: UtcInstantMs;
  endUtc: UtcInstantMs;
};

function assertValidRange(range: UtcRange): void {
  if (range.endUtc <= range.startUtc) {
    throw new RangeError('query range must have endUtc > startUtc');
  }
}

/** True if two half-open style ranges overlap (touching at endpoint = no overlap). */
export function utcRangesOverlap(
  a: { startUtc: UtcInstantMs; endUtc: UtcInstantMs },
  b: { startUtc: UtcInstantMs; endUtc: UtcInstantMs },
): boolean {
  return a.endUtc > b.startUtc && a.startUtc < b.endUtc;
}

/**
 * Returns events intersecting `[range.startUtc, range.endUtc)` in the **overlap** sense
 * used by calendar UIs (end-exclusive boundaries: an event ending exactly at range start is omitted).
 */
export function queryEventsInRange(
  state: NewcalState,
  range: UtcRange,
  options?: { calendarIds?: CalendarId[] },
): Event[] {
  assertValidRange(range);
  const calFilter = options?.calendarIds ? new Set<string>(options.calendarIds) : null;
  const out: Event[] = [];
  for (const event of Object.values(state.eventsById)) {
    if (calFilter && !calFilter.has(event.calendarId as string)) {
      continue;
    }
    if (utcRangesOverlap(event, range)) {
      out.push(event);
    }
  }
  out.sort((x, y) => x.startUtc - y.startUtc);
  return out;
}
