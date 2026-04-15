import { create, type StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  type ApplyCommandContext,
  type ApplyCommandResult,
  type CalendarCommand,
  type NewcalState,
  applyCommand,
  calendarId,
  calendarMembershipLookupKey,
  createEmptyState,
  DEFAULT_DISPLAY_TIMEZONE,
  ensureStateShape,
  eventId,
  type Event,
  userId,
  utcInstantMs,
} from '@newcal/core';

import { createCalendarPersistStorage } from './calendar-persist-storage.js';

/** Stable ids for seeded user/calendar so mock commands always have a valid target. */
export const SEED_USER_ID = userId('seed-user');
export const SEED_CALENDAR_ID = calendarId('seed-cal');

/** Another user “owns” the read-only shared calendar (Phase 10). */
export const WORKSPACE_PEER_USER_ID = userId('workspace-peer');

/**
 * Shared calendar where the seed user is a **viewer** (`canEdit: false`) — policy tests / Debug.
 */
export const READONLY_SHARED_CALENDAR_ID = calendarId('readonly-shared');

function emptyCalendarShell(): NewcalState {
  const state = createEmptyState();
  state.usersById[SEED_USER_ID as string] = {
    id: SEED_USER_ID,
    displayName: 'Seed user',
  };
  state.usersById[WORKSPACE_PEER_USER_ID as string] = {
    id: WORKSPACE_PEER_USER_ID,
    displayName: 'Workspace peer',
  };
  state.calendarsById[SEED_CALENDAR_ID as string] = {
    id: SEED_CALENDAR_ID,
    ownerUserId: SEED_USER_ID,
    name: 'Personal',
    color: '#0a84ff',
    kind: 'personal',
  };
  state.calendarsById[READONLY_SHARED_CALENDAR_ID as string] = {
    id: READONLY_SHARED_CALENDAR_ID,
    ownerUserId: WORKSPACE_PEER_USER_ID,
    name: 'Team (view only)',
    color: '#8e8e93',
    kind: 'shared',
  };
  state.eventIdsByCalendarId[SEED_CALENDAR_ID as string] = [];
  state.eventIdsByCalendarId[READONLY_SHARED_CALENDAR_ID as string] = [];

  const mKey = calendarMembershipLookupKey(SEED_USER_ID, READONLY_SHARED_CALENDAR_ID);
  state.calendarMembershipsByKey[mKey] = {
    userId: SEED_USER_ID,
    calendarId: READONLY_SHARED_CALENDAR_ID,
    role: 'viewer',
    canEdit: false,
  };

  return state;
}

/** Build a one-hour mock event starting at `startMs` (UTC epoch ms). */
export function buildMockEvent(startMs: number, targetCalendarId = SEED_CALENDAR_ID): Event {
  const id = eventId(`mock-${startMs}-${Math.random().toString(36).slice(2, 9)}`);
  return {
    id,
    calendarId: targetCalendarId,
    title: 'Mock event',
    startUtc: utcInstantMs(startMs),
    endUtc: utcInstantMs(startMs + 60 * 60 * 1000),
    displayTimeZone: DEFAULT_DISPLAY_TIMEZONE,
  };
}

const ACTOR: ApplyCommandContext = { actorUserId: SEED_USER_ID };

/** Seed graph + two demo events so the week grid is non-empty (Phase 4). */
function createBootstrappedState(): NewcalState {
  let s = emptyCalendarShell();
  const t0 = Date.now();
  const first = applyCommand(s, { type: 'createEvent', event: buildMockEvent(t0) }, ACTOR);
  if (first.ok) {
    s = first.state;
  }
  const second = applyCommand(s, { type: 'createEvent', event: buildMockEvent(t0 + 4 * 60 * 60 * 1000) }, ACTOR);
  if (second.ok) {
    s = second.state;
  }
  return s;
}

export type CalendarStore = {
  state: NewcalState;
  /** Single write path — mirrors future AI / sync applying `CalendarCommand`. */
  dispatch: (command: CalendarCommand) => ApplyCommandResult;
};

const calendarStoreSlice: StateCreator<CalendarStore> = (set, get) => ({
  state: createBootstrappedState(),
  dispatch: (command) => {
    const result = applyCommand(get().state, command, ACTOR);
    if (result.ok) {
      set({ state: result.state });
    }
    return result;
  },
});

const persistOptions = {
  name: 'newcal-calendar-v1',
  storage: createCalendarPersistStorage(),
  partialize: (s: CalendarStore) => ({ state: s.state }),
  merge: (persisted: unknown, current: CalendarStore) => {
    const p = persisted as Partial<CalendarStore> | undefined;
    if (!p?.state) {
      return current;
    }
    return {
      ...current,
      ...p,
      state: ensureStateShape(p.state),
    };
  },
} as const;

/** Tests use a non-persisted store so each run is isolated; dev/prod persist `state` to IndexedDB (Phase 9). */
export const useCalendarStore =
  import.meta.env.MODE === 'test'
    ? create<CalendarStore>(calendarStoreSlice)
    : create<CalendarStore>()(persist(calendarStoreSlice, persistOptions));

/** Reset in-memory store (tests only; avoids cross-test leakage). */
export function resetCalendarStoreState(): void {
  useCalendarStore.setState({ state: createBootstrappedState() });
}
