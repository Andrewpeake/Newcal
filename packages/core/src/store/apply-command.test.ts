import { describe, expect, it } from 'vitest';

import { DEFAULT_DISPLAY_TIMEZONE } from '../time/iana.js';
import { utcInstantMs } from '../time/utc-instant.js';
import { calendarId, eventId, userId } from '../model/ids.js';
import type { Calendar } from '../model/calendar.js';
import type { Event } from '../model/event.js';
import type { User } from '../model/user.js';
import { calendarMembershipLookupKey } from '../model/membership.js';
import { applyCommand } from './commands.js';
import { createEmptyState } from './state.js';

const actor = userId('u1');

function baseState(): { state: ReturnType<typeof createEmptyState>; cal: ReturnType<typeof calendarId> } {
  const u = userId('u1');
  const cal = calendarId('cal-1');
  const state = createEmptyState();
  const user: User = { id: u, displayName: 'T' };
  const calendar: Calendar = {
    id: cal,
    ownerUserId: u,
    name: 'Home',
    color: '#0a84ff',
    kind: 'personal',
  };
  state.usersById[u as string] = user;
  state.calendarsById[cal as string] = calendar;
  state.eventIdsByCalendarId[cal as string] = [];
  return { state, cal };
}

/** Shared calendar owned by u2; u1 is viewer with canEdit false. */
function stateWithReadonlySharedForU1(): {
  state: ReturnType<typeof createEmptyState>;
  personal: ReturnType<typeof calendarId>;
  shared: ReturnType<typeof calendarId>;
} {
  const u1 = userId('u1');
  const u2 = userId('u2');
  const personal = calendarId('cal-p');
  const shared = calendarId('cal-shared');
  const state = createEmptyState();
  state.usersById[u1 as string] = { id: u1, displayName: 'A' };
  state.usersById[u2 as string] = { id: u2, displayName: 'B' };
  state.calendarsById[personal as string] = {
    id: personal,
    ownerUserId: u1,
    name: 'Mine',
    color: '#00f',
    kind: 'personal',
  };
  state.calendarsById[shared as string] = {
    id: shared,
    ownerUserId: u2,
    name: 'Team',
    color: '#888',
    kind: 'shared',
  };
  state.eventIdsByCalendarId[personal as string] = [];
  state.eventIdsByCalendarId[shared as string] = [];
  const key = calendarMembershipLookupKey(u1, shared);
  state.calendarMembershipsByKey[key] = {
    userId: u1,
    calendarId: shared,
    role: 'viewer',
    canEdit: false,
  };
  return { state, personal, shared };
}

function makeEvent(
  id: string,
  cal: ReturnType<typeof calendarId>,
  start: number,
  end: number,
  title = 'E',
): Event {
  return {
    id: eventId(id),
    calendarId: cal,
    title,
    startUtc: utcInstantMs(start),
    endUtc: utcInstantMs(end),
    displayTimeZone: DEFAULT_DISPLAY_TIMEZONE,
  };
}

const ctx = { actorUserId: actor };

describe('applyCommand', () => {
  it('createEvent adds event and indexes', () => {
    const { state, cal } = baseState();
    const e = makeEvent('e1', cal, 1000, 2000);
    const r = applyCommand(state, { type: 'createEvent', event: e }, ctx);
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    expect(r.state.eventsById['e1']).toEqual(e);
    expect(r.state.eventIdsByCalendarId[cal as string]).toEqual(['e1']);
  });

  it('createEvent fails when calendar missing', () => {
    const { state } = baseState();
    const badCal = calendarId('missing');
    const e = makeEvent('e1', badCal, 1, 2);
    const r = applyCommand(state, { type: 'createEvent', event: e }, ctx);
    expect(r.ok).toBe(false);
    if (r.ok) {
      return;
    }
    expect(r.error.code).toBe('CALENDAR_NOT_FOUND');
  });

  it('createEvent fails with PERMISSION_DENIED when viewer cannot edit shared calendar', () => {
    const { state, shared } = stateWithReadonlySharedForU1();
    const e = makeEvent('e1', shared, 1000, 2000);
    const r = applyCommand(state, { type: 'createEvent', event: e }, ctx);
    expect(r.ok).toBe(false);
    if (r.ok) {
      return;
    }
    expect(r.error.code).toBe('PERMISSION_DENIED');
  });

  it('createEvent succeeds on personal calendar when shared membership is view-only', () => {
    const { state, personal } = stateWithReadonlySharedForU1();
    const e = makeEvent('e1', personal, 1000, 2000);
    const r = applyCommand(state, { type: 'createEvent', event: e }, ctx);
    expect(r.ok).toBe(true);
  });

  it('updateEvent fails when moving event into a calendar the actor cannot edit', () => {
    const { state, personal, shared } = stateWithReadonlySharedForU1();
    const e = makeEvent('e1', personal, 1000, 2000);
    const s1 = applyCommand(state, { type: 'createEvent', event: e }, ctx);
    expect(s1.ok).toBe(true);
    if (!s1.ok) {
      return;
    }
    const r = applyCommand(s1.state, {
      type: 'updateEvent',
      eventId: eventId('e1'),
      patch: { calendarId: shared },
    }, ctx);
    expect(r.ok).toBe(false);
    if (r.ok) {
      return;
    }
    expect(r.error.code).toBe('PERMISSION_DENIED');
  });

  it('updateEvent patches fields', () => {
    const { state, cal } = baseState();
    const e = makeEvent('e1', cal, 1000, 2000);
    const s1 = applyCommand(state, { type: 'createEvent', event: e }, ctx);
    expect(s1.ok).toBe(true);
    if (!s1.ok) {
      return;
    }
    const r = applyCommand(
      s1.state,
      {
        type: 'updateEvent',
        eventId: eventId('e1'),
        patch: { title: 'Updated' },
      },
      ctx,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    expect(r.state.eventsById['e1']?.title).toBe('Updated');
  });

  it('moveEvent preserves duration', () => {
    const { state, cal } = baseState();
    const e = makeEvent('e1', cal, 1000, 3000);
    const s1 = applyCommand(state, { type: 'createEvent', event: e }, ctx);
    expect(s1.ok).toBe(true);
    if (!s1.ok) {
      return;
    }
    const r = applyCommand(
      s1.state,
      {
        type: 'moveEvent',
        eventId: eventId('e1'),
        newStartUtc: utcInstantMs(5000),
      },
      ctx,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    expect(r.state.eventsById['e1']?.startUtc).toBe(5000);
    expect(r.state.eventsById['e1']?.endUtc).toBe(7000);
  });

  it('resizeEvent adjusts start edge', () => {
    const { state, cal } = baseState();
    const e = makeEvent('e1', cal, 1000, 4000);
    const s1 = applyCommand(state, { type: 'createEvent', event: e }, ctx);
    expect(s1.ok).toBe(true);
    if (!s1.ok) {
      return;
    }
    const r = applyCommand(
      s1.state,
      {
        type: 'resizeEvent',
        eventId: eventId('e1'),
        edge: 'start',
        newUtc: utcInstantMs(2000),
      },
      ctx,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    expect(r.state.eventsById['e1']?.startUtc).toBe(2000);
    expect(r.state.eventsById['e1']?.endUtc).toBe(4000);
  });

  it('resizeEvent rejects invalid range', () => {
    const { state, cal } = baseState();
    const e = makeEvent('e1', cal, 1000, 2000);
    const s1 = applyCommand(state, { type: 'createEvent', event: e }, ctx);
    expect(s1.ok).toBe(true);
    if (!s1.ok) {
      return;
    }
    const r = applyCommand(
      s1.state,
      {
        type: 'resizeEvent',
        eventId: eventId('e1'),
        edge: 'start',
        newUtc: utcInstantMs(2500),
      },
      ctx,
    );
    expect(r.ok).toBe(false);
    if (r.ok) {
      return;
    }
    expect(r.error.code === 'INVALID_RESIZE' || r.error.code === 'VALIDATION_FAILED').toBe(true);
  });

  it('deleteEvent removes event and index', () => {
    const { state, cal } = baseState();
    const e = makeEvent('e1', cal, 1, 2);
    const s1 = applyCommand(state, { type: 'createEvent', event: e }, ctx);
    expect(s1.ok).toBe(true);
    if (!s1.ok) {
      return;
    }
    const r = applyCommand(s1.state, { type: 'deleteEvent', eventId: eventId('e1') }, ctx);
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    expect(r.state.eventsById['e1']).toBeUndefined();
    expect(r.state.eventIdsByCalendarId[cal as string]).toEqual([]);
  });
});
