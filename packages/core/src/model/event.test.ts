import { describe, expect, it } from 'vitest';

import { DEFAULT_DISPLAY_TIMEZONE } from '../time/iana.js';
import { utcInstantMs } from '../time/utc-instant.js';
import { calendarId, eventId } from './ids.js';
import { tryCreateEvent } from './event.js';

describe('tryCreateEvent', () => {
  const cal = calendarId('cal-1');

  it('rejects end <= start', () => {
    const start = utcInstantMs(1_000);
    const end = utcInstantMs(1_000);
    const result = tryCreateEvent({
      id: eventId('e1'),
      calendarId: cal,
      title: 'Bad',
      startUtc: start,
      endUtc: end,
      displayTimeZone: DEFAULT_DISPLAY_TIMEZONE,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('END_NOT_AFTER_START');
    }
  });

  it('rejects end before start', () => {
    const result = tryCreateEvent({
      id: eventId('e2'),
      calendarId: cal,
      title: 'Bad',
      startUtc: utcInstantMs(2_000),
      endUtc: utcInstantMs(1_000),
      displayTimeZone: DEFAULT_DISPLAY_TIMEZONE,
    });
    expect(result.ok).toBe(false);
  });

  it('accepts valid event', () => {
    const result = tryCreateEvent({
      id: eventId('e3'),
      calendarId: cal,
      title: 'Ok',
      startUtc: utcInstantMs(1_000),
      endUtc: utcInstantMs(2_000),
      displayTimeZone: DEFAULT_DISPLAY_TIMEZONE,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.title).toBe('Ok');
    }
  });

  it('rejects invalid IANA zone', () => {
    const result = tryCreateEvent({
      id: eventId('e4'),
      calendarId: cal,
      title: 'Bad zone',
      startUtc: utcInstantMs(1_000),
      endUtc: utcInstantMs(2_000),
      displayTimeZone: 'Not/AZone',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_DISPLAY_TIME_ZONE');
    }
  });
});
