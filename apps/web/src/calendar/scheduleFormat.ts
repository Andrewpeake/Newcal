import { DEFAULT_DISPLAY_TIMEZONE } from '@newcal/core';

const ZONE = DEFAULT_DISPLAY_TIMEZONE;

export function formatScheduleHour(h: number): string {
  const hr = h % 12 === 0 ? 12 : h % 12;
  const ap = h < 12 ? 'am' : 'pm';
  return `${hr} ${ap}`;
}

export function formatDayHeading(dayStartUtc: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: ZONE,
  }).format(dayStartUtc);
}

/** Compact label for week grid header cells. */
export function formatShortDayLabel(dayStartUtc: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: ZONE,
  }).format(dayStartUtc);
}
