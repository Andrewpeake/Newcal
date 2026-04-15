import { useState } from 'react';

import { eventId } from '@newcal/core';
import {
  buildMockEvent,
  READONLY_SHARED_CALENDAR_ID,
  useCalendarStore,
} from '../store/calendar-store.js';

/** Store debug / mock actions (Phase 3). */
export function DebugPage() {
  const state = useCalendarStore((s) => s.state);
  const dispatch = useCalendarStore((s) => s.dispatch);
  const [permissionNote, setPermissionNote] = useState<string | null>(null);

  const eventCount = Object.keys(state.eventsById).length;
  const eventIds = Object.keys(state.eventsById);

  return (
    <main className="page">
      <h1>Debug</h1>
      <p className="lede">Dispatch commands against `@newcal/core` state (Phase 10: membership + policies).</p>

      <section className="debug-panel" aria-label="Calendar store debug">
        <h2>Store</h2>
        <p>
          Event count: <strong>{eventCount}</strong>
        </p>
        {eventIds.length > 0 ? (
          <ul className="event-id-list">
            {eventIds.map((id) => (
              <li key={id}>
                <code>{id}</code>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No events yet.</p>
        )}
        <div className="actions">
          <button
            type="button"
            onClick={() => {
              setPermissionNote(null);
              dispatch({
                type: 'createEvent',
                event: buildMockEvent(Date.now()),
              });
            }}
          >
            Add mock event
          </button>
          <button
            type="button"
            onClick={() => {
              const r = dispatch({
                type: 'createEvent',
                event: buildMockEvent(Date.now(), READONLY_SHARED_CALENDAR_ID),
              });
              setPermissionNote(
                r.ok
                  ? 'Unexpected: create succeeded'
                  : `Blocked: ${r.error.code}${
                      'calendarId' in r.error ? ` (${String(r.error.calendarId)})` : ''
                    }`,
              );
            }}
          >
            Try create on read-only shared calendar
          </button>
          <button
            type="button"
            onClick={() => {
              const first = eventIds[0];
              if (!first) {
                return;
              }
              dispatch({ type: 'deleteEvent', eventId: eventId(first) });
            }}
            disabled={eventIds.length === 0}
          >
            Delete first event
          </button>
        </div>
        {permissionNote ? <p className="muted">{permissionNote}</p> : null}
      </section>
    </main>
  );
}
