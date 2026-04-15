import {
  DEFAULT_DISPLAY_TIMEZONE,
  type Event,
  utcInstantMs,
} from '@newcal/core';
import { DateTime } from 'luxon';
import { useEffect, useId, useState } from 'react';

import { useCalendarStore } from '../store/calendar-store.js';

const ZONE = DEFAULT_DISPLAY_TIMEZONE;

export type EventEditorModalProps = {
  event: Event;
  onClose: () => void;
};

function wallFieldsFromInstant(ms: number): { date: string; time: string } {
  const dt = DateTime.fromMillis(ms, { zone: ZONE });
  return {
    date: dt.toFormat('yyyy-LL-dd'),
    time: dt.toFormat('HH:mm'),
  };
}

function instantFromWall(date: string, time: string): number {
  const dt = DateTime.fromFormat(`${date} ${time}`, 'yyyy-LL-dd HH:mm', { zone: ZONE });
  if (!dt.isValid) {
    throw new RangeError(dt.invalidExplanation ?? 'Invalid date/time');
  }
  return dt.toMillis();
}

export function EventEditorModal({ event, onClose }: EventEditorModalProps) {
  const dispatch = useCalendarStore((s) => s.dispatch);
  const titleId = useId();
  const [title, setTitle] = useState(event.title);
  const [startDate, setStartDate] = useState(() => wallFieldsFromInstant(event.startUtc).date);
  const [startTime, setStartTime] = useState(() => wallFieldsFromInstant(event.startUtc).time);
  const [endDate, setEndDate] = useState(() => wallFieldsFromInstant(event.endUtc).date);
  const [endTime, setEndTime] = useState(() => wallFieldsFromInstant(event.endUtc).time);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(event.title);
    const s = wallFieldsFromInstant(event.startUtc);
    const e = wallFieldsFromInstant(event.endUtc);
    setStartDate(s.date);
    setStartTime(s.time);
    setEndDate(e.date);
    setEndTime(e.time);
    setError(null);
  }, [event.id, event.title, event.startUtc, event.endUtc]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    let startMs: number;
    let endMs: number;
    try {
      startMs = instantFromWall(startDate, startTime);
      endMs = instantFromWall(endDate, endTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid date/time');
      return;
    }
    const r = dispatch({
      type: 'updateEvent',
      eventId: event.id,
      patch: {
        title: title.trim() || '(untitled)',
        startUtc: utcInstantMs(startMs),
        endUtc: utcInstantMs(endMs),
      },
    });
    if (!r.ok) {
      setError(
        r.error.code === 'VALIDATION_FAILED'
          ? 'End must be after start, and the display time zone must be valid.'
          : 'Could not save changes.',
      );
      return;
    }
    onClose();
  }

  return (
    <div
      className="event-editor-backdrop"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="event-editor-dialog"
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <h2 id={titleId} className="event-editor-heading">
          Edit event
        </h2>
        <p className="event-editor-zone-hint">Times are in {ZONE}.</p>
        <form onSubmit={handleSave} className="event-editor-form">
          <label className="event-editor-field">
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              autoComplete="off"
            />
          </label>
          <div className="event-editor-row">
            <label className="event-editor-field">
              <span>Start date</span>
              <input type="date" value={startDate} onChange={(ev) => setStartDate(ev.target.value)} required />
            </label>
            <label className="event-editor-field">
              <span>Start time</span>
              <input type="time" value={startTime} onChange={(ev) => setStartTime(ev.target.value)} required />
            </label>
          </div>
          <div className="event-editor-row">
            <label className="event-editor-field">
              <span>End date</span>
              <input type="date" value={endDate} onChange={(ev) => setEndDate(ev.target.value)} required />
            </label>
            <label className="event-editor-field">
              <span>End time</span>
              <input type="time" value={endTime} onChange={(ev) => setEndTime(ev.target.value)} required />
            </label>
          </div>
          {error ? <p className="event-editor-error">{error}</p> : null}
          <div className="event-editor-actions">
            <button type="button" className="event-editor-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="event-editor-save">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
