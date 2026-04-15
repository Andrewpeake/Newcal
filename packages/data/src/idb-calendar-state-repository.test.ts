import 'fake-indexeddb/auto';

import { describe, expect, it } from 'vitest';

import { createIdbCalendarStateRepository } from './idb-calendar-state-repository.js';

describe('createIdbCalendarStateRepository', () => {
  it('round-trips a persist blob', async () => {
    const repo = createIdbCalendarStateRepository();
    const key = 'newcal-calendar-v1';
    const blob = JSON.stringify({ state: { foo: 1 }, version: 0 });
    await repo.set(key, blob);
    expect(await repo.get(key)).toBe(blob);
    await repo.remove(key);
    expect(await repo.get(key)).toBeNull();
  });
});
