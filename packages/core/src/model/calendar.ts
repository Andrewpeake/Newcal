import type { CalendarId, UserId } from './ids.js';

/** `shared` / `workspace` calendars use `CalendarMembership` rows for non-owners (Phase 10). */
export type CalendarKind = 'personal' | 'shared' | 'workspace';

export type Calendar = {
  id: CalendarId;
  /** Owning user for personal calendars; workspace root user for org stubs. */
  ownerUserId: UserId;
  name: string;
  /** CSS color string, e.g. `#0a84ff` — theme tokens may wrap later. */
  color: string;
  kind: CalendarKind;
};
