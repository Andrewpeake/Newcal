/**
 * Persistence adapters for Newcal (IndexedDB, future SQLite WASM, etc.).
 * UI apps import from `@newcal/data`; domain types stay in `@newcal/core`.
 */

export type { CalendarStateRepository } from './calendar-state-repository.js';
export { createIdbCalendarStateRepository } from './idb-calendar-state-repository.js';
