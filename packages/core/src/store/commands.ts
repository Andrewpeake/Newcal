import type { Event, EventValidationError } from '../model/event.js';
import type { CalendarId, EventId, UserId } from '../model/ids.js';
import { tryCreateEvent, validateEventFull } from '../model/event.js';
import { userCanEditCalendar } from '../policies/calendar-permissions.js';
import type { UtcInstantMs } from '../time/utc-instant.js';
import { utcInstantMs } from '../time/utc-instant.js';
import { ensureStateShape } from './state.js';
import type { NewcalState } from './types.js';

export type CalendarCommand =
  | { type: 'createEvent'; event: Event }
  | { type: 'updateEvent'; eventId: EventId; patch: Partial<Omit<Event, 'id'>> }
  | { type: 'moveEvent'; eventId: EventId; newStartUtc: UtcInstantMs }
  | { type: 'resizeEvent'; eventId: EventId; edge: 'start' | 'end'; newUtc: UtcInstantMs }
  | { type: 'deleteEvent'; eventId: EventId };

export type CommandError =
  | { code: 'EVENT_NOT_FOUND'; eventId: EventId }
  | { code: 'EVENT_ALREADY_EXISTS'; eventId: EventId }
  | { code: 'CALENDAR_NOT_FOUND'; calendarId: CalendarId }
  | { code: 'VALIDATION_FAILED'; error: EventValidationError }
  | { code: 'INVALID_RESIZE'; message: string }
  | { code: 'PERMISSION_DENIED'; calendarId: CalendarId; reason: 'not_owner_or_editor' };

export type ApplyCommandResult =
  | { ok: true; state: NewcalState }
  | { ok: false; error: CommandError };

/** Who is performing the command (for membership / owner checks). */
export type ApplyCommandContext = {
  actorUserId: UserId;
};

function cloneState(state: NewcalState): NewcalState {
  return {
    usersById: { ...state.usersById },
    calendarsById: { ...state.calendarsById },
    eventsById: { ...state.eventsById },
    eventIdsByCalendarId: Object.fromEntries(
      Object.entries(state.eventIdsByCalendarId).map(([k, v]) => [k, [...v]]),
    ),
    calendarMembershipsByKey: { ...state.calendarMembershipsByKey },
  };
}

function removeEventFromIndexes(next: NewcalState, event: Event): void {
  const calId = event.calendarId as string;
  const eid = event.id as string;
  const list = next.eventIdsByCalendarId[calId];
  if (!list) {
    return;
  }
  next.eventIdsByCalendarId[calId] = list.filter((id) => id !== eid);
}

function appendEventId(next: NewcalState, calendarId: CalendarId, eventIdStr: string): void {
  const calId = calendarId as string;
  const existing = next.eventIdsByCalendarId[calId] ?? [];
  next.eventIdsByCalendarId[calId] = [...existing, eventIdStr];
}

function deny(calId: CalendarId): ApplyCommandResult {
  return { ok: false, error: { code: 'PERMISSION_DENIED', calendarId: calId, reason: 'not_owner_or_editor' } };
}

/**
 * Single write path for calendar mutations. Pure: returns a new `NewcalState` on success.
 */
export function applyCommand(
  state: NewcalState,
  command: CalendarCommand,
  context: ApplyCommandContext,
): ApplyCommandResult {
  const state0 = ensureStateShape(state);
  const actor = context.actorUserId;

  switch (command.type) {
    case 'createEvent': {
      const cal = state0.calendarsById[command.event.calendarId as string];
      if (!cal) {
        return { ok: false, error: { code: 'CALENDAR_NOT_FOUND', calendarId: command.event.calendarId } };
      }
      if (!userCanEditCalendar(state0, actor, command.event.calendarId)) {
        return deny(command.event.calendarId);
      }
      const eid = command.event.id as string;
      if (state0.eventsById[eid]) {
        return { ok: false, error: { code: 'EVENT_ALREADY_EXISTS', eventId: command.event.id } };
      }
      const created = tryCreateEvent({
        id: command.event.id,
        calendarId: command.event.calendarId,
        title: command.event.title,
        startUtc: command.event.startUtc,
        endUtc: command.event.endUtc,
        displayTimeZone: command.event.displayTimeZone,
        notes: command.event.notes,
        location: command.event.location,
      });
      if (!created.ok) {
        return { ok: false, error: { code: 'VALIDATION_FAILED', error: created.error } };
      }
      const next = cloneState(state0);
      next.eventsById[eid] = created.event;
      appendEventId(next, created.event.calendarId, eid);
      return { ok: true, state: next };
    }
    case 'updateEvent': {
      const eid = command.eventId as string;
      const existing = state0.eventsById[eid];
      if (!existing) {
        return { ok: false, error: { code: 'EVENT_NOT_FOUND', eventId: command.eventId } };
      }
      if (!userCanEditCalendar(state0, actor, existing.calendarId)) {
        return deny(existing.calendarId);
      }
      const merged: Event = {
        ...existing,
        ...command.patch,
        id: existing.id,
      };
      if (command.patch.calendarId !== undefined && command.patch.calendarId !== existing.calendarId) {
        const cal = state0.calendarsById[merged.calendarId as string];
        if (!cal) {
          return { ok: false, error: { code: 'CALENDAR_NOT_FOUND', calendarId: merged.calendarId } };
        }
        if (!userCanEditCalendar(state0, actor, merged.calendarId)) {
          return deny(merged.calendarId);
        }
      }
      const err = validateEventFull(merged);
      if (err) {
        return { ok: false, error: { code: 'VALIDATION_FAILED', error: err } };
      }
      const next = cloneState(state0);
      const old = next.eventsById[eid]!;
      removeEventFromIndexes(next, old);
      next.eventsById[eid] = merged;
      appendEventId(next, merged.calendarId, eid);
      return { ok: true, state: next };
    }
    case 'moveEvent': {
      const eid = command.eventId as string;
      const existing = state0.eventsById[eid];
      if (!existing) {
        return { ok: false, error: { code: 'EVENT_NOT_FOUND', eventId: command.eventId } };
      }
      if (!userCanEditCalendar(state0, actor, existing.calendarId)) {
        return deny(existing.calendarId);
      }
      const duration = existing.endUtc - existing.startUtc;
      const newStart = command.newStartUtc;
      const newEnd = utcInstantMs(newStart + duration);
      const merged: Event = {
        ...existing,
        startUtc: newStart,
        endUtc: newEnd,
      };
      const err = validateEventFull(merged);
      if (err) {
        return { ok: false, error: { code: 'VALIDATION_FAILED', error: err } };
      }
      const next = cloneState(state0);
      next.eventsById[eid] = merged;
      return { ok: true, state: next };
    }
    case 'resizeEvent': {
      const eid = command.eventId as string;
      const existing = state0.eventsById[eid];
      if (!existing) {
        return { ok: false, error: { code: 'EVENT_NOT_FOUND', eventId: command.eventId } };
      }
      if (!userCanEditCalendar(state0, actor, existing.calendarId)) {
        return deny(existing.calendarId);
      }
      let start = existing.startUtc;
      let end = existing.endUtc;
      if (command.edge === 'start') {
        start = command.newUtc;
      } else {
        end = command.newUtc;
      }
      if (end <= start) {
        return {
          ok: false,
          error: { code: 'INVALID_RESIZE', message: 'Resize would make end before or equal to start' },
        };
      }
      const merged: Event = {
        ...existing,
        startUtc: start,
        endUtc: end,
      };
      const err = validateEventFull(merged);
      if (err) {
        return { ok: false, error: { code: 'VALIDATION_FAILED', error: err } };
      }
      const next = cloneState(state0);
      next.eventsById[eid] = merged;
      return { ok: true, state: next };
    }
    case 'deleteEvent': {
      const eid = command.eventId as string;
      const existing = state0.eventsById[eid];
      if (!existing) {
        return { ok: false, error: { code: 'EVENT_NOT_FOUND', eventId: command.eventId } };
      }
      if (!userCanEditCalendar(state0, actor, existing.calendarId)) {
        return deny(existing.calendarId);
      }
      const next = cloneState(state0);
      delete next.eventsById[eid];
      removeEventFromIndexes(next, existing);
      return { ok: true, state: next };
    }
  }
}
