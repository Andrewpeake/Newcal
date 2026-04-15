import type { CalendarId, UserId } from './ids.js';

/** Stub roles for shared / workspace calendars (Phase 10). */
export type CalendarMemberRole = 'owner' | 'admin' | 'editor' | 'viewer';

const MEMBERSHIP_KEY_SEP = '\u0000';

/**
 * Stable lookup key for `(userId, calendarId)` membership rows in `NewcalState.calendarMembershipsByKey`.
 */
export function calendarMembershipLookupKey(userId: UserId, calendarId: CalendarId): string {
  return `${userId as string}${MEMBERSHIP_KEY_SEP}${calendarId as string}`;
}

/**
 * Membership of a user in a calendar. `canEdit` is the gate for event mutations (create/update/move/resize/delete).
 */
export type CalendarMembership = {
  userId: UserId;
  calendarId: CalendarId;
  role: CalendarMemberRole;
  canEdit: boolean;
};
