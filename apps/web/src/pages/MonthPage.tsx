import { DateTime } from 'luxon';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DEFAULT_DISPLAY_TIMEZONE } from '@newcal/core';

import { MonthView } from '../calendar/MonthView.js';

const ZONE = DEFAULT_DISPLAY_TIMEZONE;

export function MonthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const now = DateTime.now().setZone(ZONE);
  const yearParsed = Number.parseInt(searchParams.get('year') ?? '', 10);
  const monthParsed = Number.parseInt(searchParams.get('month') ?? '', 10);
  const valid =
    Number.isFinite(yearParsed) &&
    yearParsed >= 1900 &&
    yearParsed <= 2999 &&
    Number.isFinite(monthParsed) &&
    monthParsed >= 1 &&
    monthParsed <= 12;
  const year = valid ? yearParsed : now.year;
  const month = valid ? monthParsed : now.month;

  const bumpMonth = useCallback(
    (delta: number) => {
      const dt = DateTime.fromObject({ year, month, day: 1 }, { zone: ZONE }).plus({ months: delta });
      setSearchParams(
        { year: String(dt.year), month: String(dt.month) },
        { replace: true },
      );
    },
    [month, setSearchParams, year],
  );

  return (
    <main className="month-page">
      <h1 className="month-page-title">Month</h1>
      <p className="lede month-page-lede">
        Event titles per day (minimal). Click a day number to open Week view for that ISO week (Phase 8).
      </p>
      <div className="month-page-toolbar">
        <button type="button" onClick={() => bumpMonth(-1)}>
          ← Previous month
        </button>
        <button type="button" onClick={() => bumpMonth(1)}>
          Next month →
        </button>
      </div>
      <MonthView year={year} month={month} />
    </main>
  );
}
