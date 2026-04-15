import type { Event } from '../model/event.js';
import { utcInstantMs, type UtcInstantMs } from '../time/utc-instant.js';

/**
 * Clips an event to `[dayStartUtc, dayEndExclusiveUtc)` in UTC for layout within one day column.
 */
export function clipEventToDayColumn(event: Event, dayStartUtc: number, dayEndExclusiveUtc: number): Event | null {
  const start = Math.max(event.startUtc, dayStartUtc);
  const end = Math.min(event.endUtc, dayEndExclusiveUtc);
  if (end <= start) {
    return null;
  }
  return {
    ...event,
    startUtc: utcInstantMs(start),
    endUtc: utcInstantMs(end),
  };
}

export function durationMinutesFromUtcSpan(startUtc: UtcInstantMs, endUtc: UtcInstantMs): number {
  return (endUtc - startUtc) / 60_000;
}
