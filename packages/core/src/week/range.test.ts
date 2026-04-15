import { describe, expect, it } from 'vitest';

import { DEFAULT_DISPLAY_TIMEZONE } from '../time/iana.js';
import { utcInstantMsFromIso } from '../time/utc-instant.js';
import { getDayColumnBoundsUtc, getIsoWeekRangeUtc } from './range.js';

describe('getIsoWeekRangeUtc', () => {
  it('returns Monday 00:00 to next Monday 00:00 in America/Edmonton', () => {
    const anchor = utcInstantMsFromIso('2026-04-15T18:00:00.000Z');
    const r = getIsoWeekRangeUtc(anchor, DEFAULT_DISPLAY_TIMEZONE);
    const start = new Date(r.weekStartUtc).toISOString();
    const end = new Date(r.weekEndExclusiveUtc).toISOString();
    expect(start).toBe('2026-04-13T06:00:00.000Z');
    expect(end).toBe('2026-04-20T06:00:00.000Z');
  });
});

describe('getDayColumnBoundsUtc', () => {
  it('returns day 0 as Monday and day 2 as Wednesday', () => {
    const week = getIsoWeekRangeUtc(utcInstantMsFromIso('2026-04-15T12:00:00.000Z'), DEFAULT_DISPLAY_TIMEZONE);
    const mon = getDayColumnBoundsUtc(week.weekStartUtc, 0, DEFAULT_DISPLAY_TIMEZONE);
    const wed = getDayColumnBoundsUtc(week.weekStartUtc, 2, DEFAULT_DISPLAY_TIMEZONE);
    expect(new Date(mon.dayStartUtc).toISOString()).toBe('2026-04-13T06:00:00.000Z');
    expect(new Date(wed.dayStartUtc).toISOString()).toBe('2026-04-15T06:00:00.000Z');
    expect(wed.dayEndExclusiveUtc).toBeGreaterThan(wed.dayStartUtc);
  });
});
