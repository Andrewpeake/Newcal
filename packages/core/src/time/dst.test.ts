/**
 * DST assumptions (America/Edmonton):
 * - Uses IANA zone data via Luxon (Olson database).
 * - Spring 2024: DST starts March 10 ~2:00 local — clocks jump from MST (−07) to MDT (−06).
 * - Fall 2024: DST ends November 3 ~2:00 local — ambiguous hour handled by Luxon with disambiguation rules when constructing local times (not asserted here for UTC→local path).
 *
 * These tests pin **UTC instants** and assert **offset / wall** via `utcToZonedWallClock` so refactors keep behavior.
 */

import { describe, expect, it } from 'vitest';

import { DEFAULT_DISPLAY_TIMEZONE } from './iana.js';
import { utcInstantMs } from './utc-instant.js';
import { utcToZonedWallClock } from './zoned.js';

describe('America/Edmonton DST (via utcToZonedWallClock)', () => {
  it('uses MST (UTC−7) before spring forward on Mar 10, 2024', () => {
    const utc = utcInstantMs(Date.parse('2024-03-10T06:30:00.000Z'));
    const wall = utcToZonedWallClock(utc, DEFAULT_DISPLAY_TIMEZONE);
    expect(wall.offsetMinutes).toBe(-420);
    expect(wall.hour).toBe(23);
    expect(wall.day).toBe(9);
    expect(wall.month).toBe(3);
  });

  it('uses MDT (UTC−6) after spring forward on Mar 10, 2024', () => {
    const utc = utcInstantMs(Date.parse('2024-03-10T09:30:00.000Z'));
    const wall = utcToZonedWallClock(utc, DEFAULT_DISPLAY_TIMEZONE);
    expect(wall.offsetMinutes).toBe(-360);
    expect(wall.hour).toBe(3);
    expect(wall.day).toBe(10);
    expect(wall.month).toBe(3);
  });

  it('uses MDT before fall back on Nov 3, 2024 (first pass of 1am hour)', () => {
    const utc = utcInstantMs(Date.parse('2024-11-03T07:30:00.000Z'));
    const wall = utcToZonedWallClock(utc, DEFAULT_DISPLAY_TIMEZONE);
    expect(wall.offsetMinutes).toBe(-360);
    expect(wall.hour).toBe(1);
    expect(wall.day).toBe(3);
    expect(wall.month).toBe(11);
  });

  it('uses MST after fall back on Nov 3, 2024', () => {
    const utc = utcInstantMs(Date.parse('2024-11-03T08:30:00.000Z'));
    const wall = utcToZonedWallClock(utc, DEFAULT_DISPLAY_TIMEZONE);
    expect(wall.offsetMinutes).toBe(-420);
    expect(wall.hour).toBe(1);
    expect(wall.day).toBe(3);
    expect(wall.month).toBe(11);
  });

  it('mid-summer uses MDT offset consistently', () => {
    const utc = utcInstantMs(Date.parse('2024-07-15T18:00:00.000Z'));
    const wall = utcToZonedWallClock(utc, DEFAULT_DISPLAY_TIMEZONE);
    expect(wall.offsetMinutes).toBe(-360);
    expect(wall.hour).toBe(12);
    expect(wall.month).toBe(7);
  });
});
