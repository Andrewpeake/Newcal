import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DayView } from '../calendar/DayView.js';
import { todayYmd } from '../calendar/weekNavigation.js';

export function DayPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('date');
  const ymd = raw !== null && raw.trim() !== '' ? raw.trim() : todayYmd();

  const setYmd = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next === todayYmd()) {
            p.delete('date');
          } else {
            p.set('date', next);
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
      <h1 className="week-page-title">Day</h1>
      <p className="lede week-page-lede">
        One day at a time — same event store as Week. Optional <code>date</code> query (<code>yyyy-MM-dd</code>
        ); defaults to today.
      </p>
      <DayView ymd={ymd} onDayChange={setYmd} />
    </main>
  );
}
