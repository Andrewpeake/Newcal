/**
 * Default IANA time zone for display and interpretation until user settings exist (Phase 1).
 * Calgary aligns with `America/Edmonton` (Mountain Time with DST).
 */
export const DEFAULT_DISPLAY_TIMEZONE = 'America/Edmonton' as const;

export type DefaultDisplayTimeZone = typeof DEFAULT_DISPLAY_TIMEZONE;

/** User- or event-level IANA identifier (e.g. `America/Edmonton`). */
export type IanaTimeZoneId = string;
