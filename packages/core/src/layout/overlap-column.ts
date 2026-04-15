import type { Event } from '../model/event.js';
import type { EventId } from '../model/ids.js';
import { utcRangesOverlap } from '../store/query.js';
import type { UtcInstantMs } from '../time/utc-instant.js';

export type OverlapPlacement = {
  eventId: EventId;
  /** Zero-based column within the overlap component (equal-width columns). */
  columnIndex: number;
  /** Number of equal-width columns for this component. */
  columnCount: number;
};

function connectedComponents(events: Event[]): Event[][] {
  const n = events.length;
  if (n === 0) {
    return [];
  }
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    if (parent[x] !== x) {
      parent[x] = find(parent[x]!);
    }
    return parent[x]!;
  };
  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      parent[rb] = ra;
    }
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (utcRangesOverlap(events[i]!, events[j]!)) {
        union(i, j);
      }
    }
  }
  const groups = new Map<number, Event[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    const arr = groups.get(r) ?? [];
    arr.push(events[i]!);
    groups.set(r, arr);
  }
  return [...groups.values()];
}

/**
 * Greedy column assignment (first-fit) for one overlap component.
 * `columnCount` equals the number of parallel lanes needed (interval graph chromatic number).
 */
function assignColumnsGreedy(component: Event[]): Map<string, { columnIndex: number; columnCount: number }> {
  const sorted = [...component].sort(
    (a, b) => a.startUtc - b.startUtc || a.endUtc - b.endUtc,
  );
  /** Last end time placed in each column (exclusive end semantics vs `utcRangesOverlap`). */
  const columnEnds: UtcInstantMs[] = [];
  const out = new Map<string, { columnIndex: number; columnCount: number }>();
  for (const e of sorted) {
    let col = -1;
    for (let c = 0; c < columnEnds.length; c++) {
      if (columnEnds[c]! <= e.startUtc) {
        col = c;
        break;
      }
    }
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(e.endUtc);
    } else {
      columnEnds[col] = e.endUtc;
    }
    out.set(e.id as string, { columnIndex: col, columnCount: columnEnds.length });
  }
  const columnCount = columnEnds.length;
  for (const v of out.values()) {
    v.columnCount = columnCount;
  }
  return out;
}

/**
 * Computes side-by-side columns for timed events in a single day column (Apple-like).
 * Pass events that already intersect the visible day; ordering is by overlap groups + greedy lanes.
 */
export function layoutSingleDayColumn(events: Event[]): OverlapPlacement[] {
  if (events.length === 0) {
    return [];
  }
  const components = connectedComponents(events);
  const placements: OverlapPlacement[] = [];
  for (const comp of components) {
    const map = assignColumnsGreedy(comp);
    for (const e of comp) {
      const p = map.get(e.id as string);
      if (!p) {
        continue;
      }
      placements.push({
        eventId: e.id,
        columnIndex: p.columnIndex,
        columnCount: p.columnCount,
      });
    }
  }
  return placements;
}
