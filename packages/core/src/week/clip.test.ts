import { describe, expect, it } from 'vitest';

import { DEFAULT_DISPLAY_TIMEZONE } from '../time/iana.js';
import { calendarId, eventId } from '../model/ids.js';
import type { Event } from '../model/event.js';
import { utcInstantMs } from '../time/utc-instant.js';
import { clipEventToDayColumn, durationMinutesFromUtcSpan } from './clip.js';

describe('clipEventToDayColumn', () => {
  const cal = calendarId('c1');
  const base: Omit<Event, 'startUtc' | 'endUtc'> = {
    id: eventId('e1'),
    calendarId: cal,
    title: 'x',
    displayTimeZone: DEFAULT_DISPLAY_TIMEZONE,
  };

  it('returns null when event does not intersect day', () => {
    const e: Event = {
      ...base,
      startUtc: utcInstantMs(100),
      endUtc: utcInstantMs(200),
    };
    expect(clipEventToDayColumn(e, 200, 300)).toBeNull();
  });

  it('clips to day bounds', () => {
    const e: Event = {
      ...base,
      startUtc: utcInstantMs(100),
      endUtc: utcInstantMs(500),
    };
    const c = clipEventToDayColumn(e, 200, 400);
    expect(c?.startUtc).toBe(200);
    expect(c?.endUtc).toBe(400);
  });
});

describe('durationMinutesFromUtcSpan', () => {
  it('converts ms span to minutes', () => {
    expect(durationMinutesFromUtcSpan(utcInstantMs(0), utcInstantMs(60 * 60 * 1000))).toBe(60);
  });
});
