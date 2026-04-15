import { describe, expect, it } from 'vitest';

import { calendarId, userId } from '../model/ids.js';
import { calendarMembershipLookupKey } from '../model/membership.js';
import { createEmptyState } from '../store/state.js';
import { userCanEditCalendar } from './calendar-permissions.js';

describe('userCanEditCalendar', () => {
  it('returns true for calendar owner without membership row', () => {
    const u = userId('alice');
    const cal = calendarId('c1');
    const state = createEmptyState();
    state.calendarsById[cal as string] = {
      id: cal,
      ownerUserId: u,
      name: 'P',
      color: '#000',
      kind: 'personal',
    };
    expect(userCanEditCalendar(state, u, cal)).toBe(true);
  });

  it('returns true when membership has canEdit', () => {
    const u = userId('bob');
    const owner = userId('alice');
    const cal = calendarId('c1');
    const state = createEmptyState();
    state.calendarsById[cal as string] = {
      id: cal,
      ownerUserId: owner,
      name: 'S',
      color: '#000',
      kind: 'shared',
    };
    const key = calendarMembershipLookupKey(u, cal);
    state.calendarMembershipsByKey[key] = {
      userId: u,
      calendarId: cal,
      role: 'editor',
      canEdit: true,
    };
    expect(userCanEditCalendar(state, u, cal)).toBe(true);
  });

  it('returns false when membership has canEdit false', () => {
    const u = userId('bob');
    const owner = userId('alice');
    const cal = calendarId('c1');
    const state = createEmptyState();
    state.calendarsById[cal as string] = {
      id: cal,
      ownerUserId: owner,
      name: 'S',
      color: '#000',
      kind: 'shared',
    };
    const key = calendarMembershipLookupKey(u, cal);
    state.calendarMembershipsByKey[key] = {
      userId: u,
      calendarId: cal,
      role: 'viewer',
      canEdit: false,
    };
    expect(userCanEditCalendar(state, u, cal)).toBe(false);
  });
});
