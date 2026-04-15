import type { UserId } from './ids.js';

export type User = {
  id: UserId;
  /** Display name — optional until profile sync exists. */
  displayName?: string;
};
