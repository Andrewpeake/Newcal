import { describe, expect, it } from 'vitest';

import { DEFAULT_DISPLAY_TIMEZONE } from '../time/iana.js';
import { utcInstantMs } from '../time/utc-instant.js';
import { calendarId, eventId } from '../model/ids.js';
import type { Event } from '../model/event.js';
import { layoutSingleDayColumn } from './overlap-column.js';

const cal = calendarId('cal-1');

function ev(id: string, start: number, end: number): Event {
  return {
    id: eventId(id),
    calendarId: cal,
    title: id,
    startUtc: utcInstantMs(start),
    endUtc: utcInstantMs(end),
    displayTimeZone: DEFAULT_DISPLAY_TIMEZONE,
  };
}

function byId(placements: ReturnType<typeof layoutSingleDayColumn>, id: string) {
  return placements.find((p) => (p.eventId as string) === id);
}

describe('layoutSingleDayColumn', () => {
  it('returns empty array for no events', () => {
    expect(layoutSingleDayColumn([])).toEqual([]);
  });

  it('single event uses full width (one column)', () => {
    const placements = layoutSingleDayColumn([ev('a', 100, 200)]);
    expect(placements).toHaveLength(1);
    expect(byId(placements, 'a')).toEqual({
      eventId: eventId('a'),
      columnIndex: 0,
      columnCount: 1,
    });
  });

  it('two non-overlapping events each get their own full-width lane (separate components)', () => {
    const placements = layoutSingleDayColumn([ev('a', 100, 200), ev('b', 300, 400)]);
    expect(placements).toHaveLength(2);
    expect(byId(placements, 'a')).toMatchObject({ columnIndex: 0, columnCount: 1 });
    expect(byId(placements, 'b')).toMatchObject({ columnIndex: 0, columnCount: 1 });
  });

  it('two overlapping events split into two columns', () => {
    const placements = layoutSingleDayColumn([ev('a', 100, 300), ev('b', 200, 400)]);
    expect(placements).toHaveLength(2);
    const pa = byId(placements, 'a');
    const pb = byId(placements, 'b');
    expect(pa?.columnCount).toBe(2);
    expect(pb?.columnCount).toBe(2);
    expect(new Set([pa?.columnIndex, pb?.columnIndex]).size).toBe(2);
  });

  it('three-event chain uses two columns (golden)', () => {
    const placements = layoutSingleDayColumn([ev('a', 100, 250), ev('b', 200, 350), ev('c', 300, 450)]);
    expect(placements).toHaveLength(3);
    for (const id of ['a', 'b', 'c']) {
      expect(byId(placements, id)?.columnCount).toBe(2);
    }
    expect(byId(placements, 'a')?.columnIndex).toBe(0);
    expect(byId(placements, 'b')?.columnIndex).toBe(1);
    expect(byId(placements, 'c')?.columnIndex).toBe(0);
  });

  it('four simultaneous overlapping events use four columns', () => {
    const placements = layoutSingleDayColumn([
      ev('a', 100, 400),
      ev('b', 100, 400),
      ev('c', 100, 400),
      ev('d', 100, 400),
    ]);
    expect(placements).toHaveLength(4);
    for (const id of ['a', 'b', 'c', 'd']) {
      expect(byId(placements, id)?.columnCount).toBe(4);
    }
    const idx = new Set(placements.map((p) => p.columnIndex));
    expect(idx.size).toBe(4);
  });
});
