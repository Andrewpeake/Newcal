import { describe, expect, it } from 'vitest';

import { resolveCalendarPointerIntent } from './inputPolicy.js';

describe('resolveCalendarPointerIntent', () => {
  it('maps grid background to create/click intent', () => {
    const r = resolveCalendarPointerIntent({
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      target: 'day-grid-background',
    });
    expect(r).toEqual({ kind: 'grid-drag-create-or-click', target: 'day-grid-background' });
  });

  it('ignores non-primary buttons', () => {
    const r = resolveCalendarPointerIntent({
      button: 2,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      target: 'day-grid-background',
    });
    expect(r.kind).toBe('ignored');
  });

  it('reserves ctrl/meta for future combined gestures', () => {
    const r = resolveCalendarPointerIntent({
      button: 0,
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      target: 'day-grid-background',
    });
    expect(r.kind).toBe('reserved-modifier-gesture');
  });
});
