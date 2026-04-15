/**
 * Key–value persistence for serialized calendar state (e.g. Zustand persist blobs).
 * Implementations may use IndexedDB, SQLite WASM, etc.
 */
export type CalendarStateRepository = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};
