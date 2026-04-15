import type { CalendarId, UserId } from '../model/ids.js';
import { calendarMembershipLookupKey } from '../model/membership.js';
import type { NewcalState } from '../store/types.js';

/**
 * Whether `actorUserId` may mutate events on `calendarId` (create, update, move, resize, delete).
 * Calendar **owner** always has edit access. Otherwise requires a membership row with `canEdit: true`.
 */
export function userCanEditCalendar(
  state: NewcalState,
  actorUserId: UserId,
  calendarId: CalendarId,
): boolean {
  const cal = state.calendarsById[calendarId as string];
  if (!cal) {
    return false;
  }
  if (cal.ownerUserId === actorUserId) {
    return true;
  }
  const key = calendarMembershipLookupKey(actorUserId, calendarId);
  const m = state.calendarMembershipsByKey[key];
  return m?.canEdit === true;
}
