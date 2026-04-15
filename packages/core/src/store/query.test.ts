import { describe, expect, it } from 'vitest';

import { DEFAULT_DISPLAY_TIMEZONE } from '../time/iana.js';
import { utcInstantMs } from '../time/utc-instant.js';
import { calendarId, eventId, userId } from '../model/ids.js';
import type { Calendar } from '../model/calendar.js';
import type { Event } from '../model/event.js';
import type { User } from '../model/user.js';
import { createEmptyState } from './state.js';
import { queryEventsInRange, utcRangesOverlap } from './query.js';

function seedState(events: Event[], calendars: Calendar[], users: User[]) {
  const state = createEmptyState();
  for (const u of users) {
    state.usersById[u.id as string] = u;
  }
  for (const c of calendars) {
    state.calendarsById[c.id as string] = c;
    state.eventIdsByCalendarId[c.id as string] = [];
  }
  for (const e of events) {
    state.eventsById[e.id as string] = e;
    const list = state.eventIdsByCalendarId[e.calendarId as string];
    if (list) {
      list.push(e.id as string);
    } else {
      state.eventIdsByCalendarId[e.calendarId as string] = [e.id as string];
    }
  }
  return state;
}

describe('utcRangesOverlap', () => {
  it('returns false when ranges only touch at an endpoint', () => {
    const a = { startUtc: utcInstantMs(100), endUtc: utcInstantMs(200) };
    const b = { startUtc: utcInstantMs(200), endUtc: utcInstantMs(300) };
    expect(utcRangesOverlap(a, b)).toBe(false);
  });

  it('returns true for partial overlap', () => {
    const a = { startUtc: utcInstantMs(100), endUtc: utcInstantMs(250) };
    const b = { startUtc: utcInstantMs(200), endUtc: utcInstantMs(300) };
    expect(utcRangesOverlap(a, b)).toBe(true);
  });
});

describe('queryEventsInRange', () => {
  const u1 = userId('u1');
  const cal = calendarId('cal-1');
  const calendar: Calendar = {
    id: cal,
    ownerUserId: u1,
    name: 'Home',
    color: '#0a84ff',
    kind: 'personal',
  };
  const user: User = { id: u1, displayName: 'Test' };

  const e1: Event = {
    id: eventId('e1'),
    calendarId: cal,
    title: 'Early',
    startUtc: utcInstantMs(100),
    endUtc: utcInstantMs(200),
    displayTimeZone: DEFAULT_DISPLAY_TIMEZONE,
  };
  const e2: Event = {
    id: eventId('e2'),
    calendarId: cal,
    title: 'Late',
    startUtc: utcInstantMs(500),
    endUtc: utcInstantMs(600),
    displayTimeZone: DEFAULT_DISPLAY_TIMEZONE,
  };

  it('returns events overlapping range and sorts by start', () => {
    const state = seedState([e2, e1], [calendar], [user]);
    const found = queryEventsInRange(state, {
      startUtc: utcInstantMs(150),
      endUtc: utcInstantMs(550),
    });
    expect(found.map((e) => e.id)).toEqual([e1.id, e2.id]);
  });

  it('filters by calendar id when provided', () => {
    const cal2 = calendarId('cal-2');
    const calendar2: Calendar = { ...calendar, id: cal2, name: 'Work' };
    const eOther: Event = { ...e1, id: eventId('e3'), calendarId: cal2 };
    const state = seedState([e1, eOther], [calendar, calendar2], [user]);
    const found = queryEventsInRange(
      state,
      { startUtc: utcInstantMs(0), endUtc: utcInstantMs(1000) },
      { calendarIds: [cal] },
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.id).toBe(e1.id);
  });

  it('throws on invalid range', () => {
    const state = seedState([], [calendar], [user]);
    expect(() =>
      queryEventsInRange(state, { startUtc: utcInstantMs(10), endUtc: utcInstantMs(10) }),
    ).toThrow(RangeError);
  });

  it('excludes event that ends exactly at range start (half-open)', () => {
    const state = seedState([e1], [calendar], [user]);
    const found = queryEventsInRange(state, {
      startUtc: utcInstantMs(200),
      endUtc: utcInstantMs(500),
    });
    expect(found).toHaveLength(0);
  });

  it('excludes event that starts exactly at range end (half-open)', () => {
    const state = seedState([e1], [calendar], [user]);
    const found = queryEventsInRange(state, {
      startUtc: utcInstantMs(0),
      endUtc: utcInstantMs(100),
    });
    expect(found).toHaveLength(0);
  });

  it('returns empty when no events overlap', () => {
    const state = seedState([e1], [calendar], [user]);
    const found = queryEventsInRange(state, {
      startUtc: utcInstantMs(300),
      endUtc: utcInstantMs(400),
    });
    expect(found).toHaveLength(0);
  });
});
