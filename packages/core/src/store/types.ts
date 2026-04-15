import type { Calendar } from '../model/calendar.js';
import type { Event } from '../model/event.js';
import type { CalendarMembership } from '../model/membership.js';
import type { User } from '../model/user.js';

/**
 * Normalized client-side state. Persistence and sync adapters map to/from this shape.
 */
export type NewcalState = {
  usersById: Record<string, User>;
  calendarsById: Record<string, Calendar>;
  eventsById: Record<string, Event>;
  /** Fast lookup: calendar → event ids (creation order). */
  eventIdsByCalendarId: Record<string, string[]>;
  /** Non-owner access to calendars. Keys: `calendarMembershipLookupKey`. */
  calendarMembershipsByKey: Record<string, CalendarMembership>;
};
