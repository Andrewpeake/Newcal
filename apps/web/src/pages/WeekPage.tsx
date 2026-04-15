import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { WeekView } from '../calendar/WeekView.js';

function parseWeekOffsetParam(raw: string | null): number {
  if (raw === null || raw === '') {
    return 0;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

export function WeekPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const weekOffsetWeeks = parseWeekOffsetParam(searchParams.get('weekOffset'));

  const setWeekOffsetWeeks = useCallback(
    (next: number | ((prev: number) => number)) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          const cur = parseWeekOffsetParam(p.get('weekOffset'));
          const resolved = typeof next === 'function' ? next(cur) : next;
          if (resolved === 0) {
            p.delete('weekOffset');
          } else {
            p.set('weekOffset', String(resolved));
          }
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return (
    <main className="week-page">
      <h1 className="week-page-title">Week</h1>
      <p className="lede week-page-lede">
        Monday-start week · {`America/Edmonton`} · three weeks in one strip (pan across week boundaries); sticky
        time column · drag to create, move, resize; click to edit. Zoom (toolbar or ⌃/⌘ + scroll) scales hours and
        day columns (Phase 7). State persists in this browser and <code>weekOffset</code> in the URL keeps the week
        when you refresh or share the link (Phase 9 preview).
      </p>
      <WeekView weekOffsetWeeks={weekOffsetWeeks} onWeekChange={setWeekOffsetWeeks} />
    </main>
  );
}
