import type { IanaTimeZoneId } from '../time/iana.js';
import type { UtcInstantMs } from '../time/utc-instant.js';
import { isValidIanaZone } from '../time/zoned.js';
import type { CalendarId, EventId } from './ids.js';

/**
 * Timed calendar event. Bounds are stored as UTC instants; `displayTimeZone` drives
 * recurrence / wall-clock display (Phase 2+); grid defaults may still use app settings.
 */
export type Event = {
  id: EventId;
  calendarId: CalendarId;
  title: string;
  startUtc: UtcInstantMs;
  endUtc: UtcInstantMs;
  /** IANA zone for display / recurrence semantics. */
  displayTimeZone: IanaTimeZoneId;
  /** Optional notes — fuller editor in UI later. */
  notes?: string;
  /** Optional location string. */
  location?: string;
};

export type EventValidationError =
  | { code: 'END_NOT_AFTER_START'; startUtc: UtcInstantMs; endUtc: UtcInstantMs }
  | { code: 'INVALID_DISPLAY_TIME_ZONE'; displayTimeZone: string };

export type CreateEventInput = Omit<Event, 'id'> & { id: EventId };

export function validateEvent(event: Pick<Event, 'startUtc' | 'endUtc'>): EventValidationError | null {
  if (event.endUtc <= event.startUtc) {
    return { code: 'END_NOT_AFTER_START', startUtc: event.startUtc, endUtc: event.endUtc };
  }
  return null;
}

export function validateEventFull(event: Event): EventValidationError | null {
  const range = validateEvent(event);
  if (range) {
    return range;
  }
  if (!isValidIanaZone(event.displayTimeZone, event.startUtc)) {
    return { code: 'INVALID_DISPLAY_TIME_ZONE', displayTimeZone: event.displayTimeZone };
  }
  return null;
}

export function tryCreateEvent(input: CreateEventInput): { ok: true; event: Event } | { ok: false; error: EventValidationError } {
  const candidate: Event = {
    id: input.id,
    calendarId: input.calendarId,
    title: input.title,
    startUtc: input.startUtc,
    endUtc: input.endUtc,
    displayTimeZone: input.displayTimeZone,
    notes: input.notes,
    location: input.location,
  };
  const err = validateEventFull(candidate);
  if (err) {
    return { ok: false, error: err };
  }
  return { ok: true, event: candidate };
}
