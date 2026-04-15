/**
 * Phase 11 — gesture / input policy (stub).
 *
 * **Extension points:** Map DOM targets (grid vs event chrome) to `PointerTargetKind`, then call
 * {@link resolveCalendarPointerIntent}. Week/Day views should keep pointer handlers thin and delegate
 * decisions here so modifier keys and future pen/touch rules stay centralized.
 */

export type PointerButton = 0 | 1 | 2;

/** Where the pointer went down (caller maps from event.target / data attributes). */
export type PointerTargetKind =
  | 'day-grid-background'
  | 'event-body'
  | 'event-resize-start'
  | 'event-resize-end'
  | 'toolbar'
  | 'unknown';

export type PointerIntentSample = {
  button: PointerButton;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  target: PointerTargetKind;
};

export type CalendarPointerIntent =
  | { kind: 'grid-drag-create-or-click'; target: 'day-grid-background' }
  | { kind: 'event-drag-move'; target: 'event-body' }
  | { kind: 'event-resize'; edge: 'start' | 'end' }
  | { kind: 'reserved-modifier-gesture'; detail: string }
  | { kind: 'ignored'; reason: string };

/**
 * Resolves a coarse intent from pointer modifiers + target. Does not perform hit-testing.
 * Full drag vs click timing lives in view code until this layer absorbs thresholds.
 */
export function resolveCalendarPointerIntent(sample: PointerIntentSample): CalendarPointerIntent {
  if (sample.button !== 0) {
    return { kind: 'ignored', reason: 'non-primary-button' };
  }
  if (sample.metaKey || sample.ctrlKey) {
    return {
      kind: 'reserved-modifier-gesture',
      detail: 'Meta/Ctrl reserved (e.g. zoom with wheel); combine with target in a later iteration',
    };
  }
  switch (sample.target) {
    case 'day-grid-background':
      return { kind: 'grid-drag-create-or-click', target: 'day-grid-background' };
    case 'event-body':
      return { kind: 'event-drag-move', target: 'event-body' };
    case 'event-resize-start':
      return { kind: 'event-resize', edge: 'start' };
    case 'event-resize-end':
      return { kind: 'event-resize', edge: 'end' };
    case 'toolbar':
      return { kind: 'ignored', reason: 'toolbar' };
    default:
      return { kind: 'ignored', reason: 'unknown-target' };
  }
}
