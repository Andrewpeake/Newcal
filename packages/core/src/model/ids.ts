export type UserId = string & { readonly __brand: 'UserId' };
export type CalendarId = string & { readonly __brand: 'CalendarId' };
export type EventId = string & { readonly __brand: 'EventId' };

export function userId(value: string): UserId {
  return value as UserId;
}

export function calendarId(value: string): CalendarId {
  return value as CalendarId;
}

export function eventId(value: string): EventId {
  return value as EventId;
}
