import { describe, expect, it } from 'vitest';

import { DEFAULT_DISPLAY_TIMEZONE } from '../time/iana.js';
import { utcInstantMsFromIso } from '../time/utc-instant.js';
import { minutesFromMidnightForUtcInZone } from './minutes.js';

describe('minutesFromMidnightForUtcInZone', () => {
  it('returns 0 at local midnight', () => {
    const utc = utcInstantMsFromIso('2026-04-13T06:00:00.000Z');
    expect(minutesFromMidnightForUtcInZone(utc, DEFAULT_DISPLAY_TIMEZONE)).toBe(0);
  });

  it('returns 12 * 60 at local noon', () => {
    const utc = utcInstantMsFromIso('2026-04-13T18:00:00.000Z');
    expect(minutesFromMidnightForUtcInZone(utc, DEFAULT_DISPLAY_TIMEZONE)).toBe(12 * 60);
  });
});
