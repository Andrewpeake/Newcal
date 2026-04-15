import type { NewcalState } from './types.js';

export function createEmptyState(): NewcalState {
  return {
    usersById: {},
    calendarsById: {},
    eventsById: {},
    eventIdsByCalendarId: {},
    calendarMembershipsByKey: {},
  };
}

/** Fills fields added after older persisted snapshots (e.g. new maps). */
export function ensureStateShape(state: NewcalState): NewcalState {
  if (state.calendarMembershipsByKey !== undefined) {
    return state;
  }
  return { ...state, calendarMembershipsByKey: {} };
}
