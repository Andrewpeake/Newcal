import type { NewcalState } from '@newcal/core';
import { createIdbCalendarStateRepository } from '@newcal/data';
import type { PersistStorage, StorageValue } from 'zustand/middleware';

type CalendarPersisted = { state: NewcalState };

const repo = createIdbCalendarStateRepository();

/**
 * Zustand persist adapter: IndexedDB primary, one-time migration from legacy localStorage (Phase 9 preview).
 */
export function createCalendarPersistStorage(): PersistStorage<CalendarPersisted> {
  return {
    getItem: async (name): Promise<StorageValue<CalendarPersisted> | null> => {
      const fromIdb = await repo.get(name);
      if (fromIdb) {
        return JSON.parse(fromIdb) as StorageValue<CalendarPersisted>;
      }
      if (typeof localStorage !== 'undefined') {
        try {
          const legacy = localStorage.getItem(name);
          if (legacy) {
            await repo.set(name, legacy);
            localStorage.removeItem(name);
            return JSON.parse(legacy) as StorageValue<CalendarPersisted>;
          }
        } catch {
          /* ignore quota / private mode */
        }
      }
      return null;
    },
    setItem: async (name, value) => {
      await repo.set(name, JSON.stringify(value));
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(name);
        } catch {
          /* ignore */
        }
      }
    },
    removeItem: async (name) => {
      await repo.remove(name);
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(name);
        } catch {
          /* ignore */
        }
      }
    },
  };
}
