import { describe, expect, it } from 'vitest';

import { DEFAULT_DISPLAY_TIMEZONE } from '../time/iana.js';
import { utcInstantMsFromIso } from '../time/utc-instant.js';
import { minutesFromMidnightForUtcInZone } from './minutes.js';
import { getDayColumnBoundsUtc, getIsoWeekRangeUtc } from './range.js';
import { utcInstantAtMinutesOnCalendarDay } from './instant-from-day.js';

describe('utcInstantAtMinutesOnCalendarDay', () => {
  it('round-trips with minutesFromMidnightForUtcInZone for noon', () => {
    const week = getIsoWeekRangeUtc(utcInstantMsFromIso('2026-04-15T12:00:00.000Z'), DEFAULT_DISPLAY_TIMEZONE);
    const wed = getDayColumnBoundsUtc(week.weekStartUtc, 2, DEFAULT_DISPLAY_TIMEZONE);
    const utc = utcInstantAtMinutesOnCalendarDay(wed.dayStartUtc, 12 * 60, DEFAULT_DISPLAY_TIMEZONE);
    expect(minutesFromMidnightForUtcInZone(utc, DEFAULT_DISPLAY_TIMEZONE)).toBeCloseTo(12 * 60, 5);
  });
});
