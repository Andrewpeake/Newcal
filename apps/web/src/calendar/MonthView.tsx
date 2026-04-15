import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';

import { DEFAULT_DISPLAY_TIMEZONE, queryEventsInRange, utcInstantMs } from '@newcal/core';

import { weekOffsetWeeksFromUtcAnchor } from './weekNavigation.js';
import { useCalendarStore } from '../store/calendar-store.js';

const ZONE = DEFAULT_DISPLAY_TIMEZONE;

export type MonthViewProps = {
  year: number;
  month: number;
};

function buildMonthGrid(year: number, month: number): DateTime[] {
  const first = DateTime.fromObject({ year, month, day: 1 }, { zone: ZONE });
  const gridStart = first.minus({ days: first.weekday - 1 }).startOf('day');
  const cells: DateTime[] = [];
  let c = gridStart;
  for (let i = 0; i < 42; i++) {
    cells.push(c);
    c = c.plus({ days: 1 });
  }
  return cells;
}

export function MonthView({ year, month }: MonthViewProps) {
  const state = useCalendarStore((s) => s.state);
  const cells = buildMonthGrid(year, month);
  const title = DateTime.fromObject({ year, month, day: 1 }, { zone: ZONE }).toFormat('LLLL yyyy');

  return (
    <section className="month-view" aria-label="Month view">
      <h2 className="month-view-title">{title}</h2>
      <div className="month-grid" role="grid" aria-label={`Calendar ${title}`}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="month-grid-dow" role="columnheader">
            {d}
          </div>
        ))}
        {cells.map((dt) => {
          const inMonth = dt.year === year && dt.month === month;
          const dayStart = dt.startOf('day');
          const dayEndEx = dayStart.plus({ days: 1 });
          const events = queryEventsInRange(state, {
            startUtc: utcInstantMs(dayStart.toMillis()),
            endUtc: utcInstantMs(dayEndEx.toMillis()),
          });
          const weekOffset = weekOffsetWeeksFromUtcAnchor(dayStart.toMillis());
          const toWeek = `/?weekOffset=${weekOffset}`;

          return (
            <div
              key={`${dt.year}-${dt.month}-${dt.day}`}
              className={`month-cell${inMonth ? ' month-cell--in-month' : ''}`}
              role="gridcell"
            >
              <Link className="month-cell-day" to={toWeek} title="Open this week in Week view">
                {dt.day}
              </Link>
              <ul className="month-cell-events">
                {events.slice(0, 4).map((ev) => (
                  <li key={ev.id as string} className="month-cell-event-title">
                    {ev.title}
                  </li>
                ))}
                {events.length > 4 ? (
                  <li className="month-cell-more">+{events.length - 4} more</li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="month-view-hint muted">Click a day number to open Week view focused on that week.</p>
    </section>
  );
}
