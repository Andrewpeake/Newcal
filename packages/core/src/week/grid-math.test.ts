import { describe, expect, it } from 'vitest';

import {
  contentYFromMinutesFromDayStart,
  dayGridHeightPx,
  minutesFromDayStartFromContentY,
} from './grid-math.js';

describe('grid-math', () => {
  const ppm = 2;

  it('maps content Y to minutes for a fixed pixels-per-minute scale', () => {
    expect(minutesFromDayStartFromContentY({ contentY: 0, pixelsPerMinute: ppm })).toBe(0);
    expect(minutesFromDayStartFromContentY({ contentY: 120, pixelsPerMinute: ppm })).toBe(60);
    expect(minutesFromDayStartFromContentY({ contentY: 1440 * ppm, pixelsPerMinute: ppm })).toBe(1440);
  });

  it('round-trips minutes ↔ content Y', () => {
    const m = 375.5;
    const y = contentYFromMinutesFromDayStart({ minutesFromDayStart: m, pixelsPerMinute: ppm });
    expect(minutesFromDayStartFromContentY({ contentY: y, pixelsPerMinute: ppm })).toBe(m);
  });

  it('computes full day height', () => {
    expect(dayGridHeightPx({ pixelsPerMinute: 1 })).toBe(1440);
    expect(dayGridHeightPx({ pixelsPerMinute: 1.5 })).toBe(1440 * 1.5);
  });
});
