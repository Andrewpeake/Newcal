/**
 * @newcal/core — **public API**
 *
 * **Import rule:** applications (`apps/*`) must import only from this package entry:
 * `import { … } from '@newcal/core'`.
 *
 * Do **not** deep-import from internal paths (e.g. `@newcal/core/src/...`); those are not
 * part of the stable contract and may change without notice.
 *
 * This package must remain **free of UI framework dependencies** (no React, no DOM APIs)
 * so the calendar engine can be reused on web and native targets.
 */

/** Branded string for documentation; the package name consumers depend on. */
export type NewcalCorePackage = '@newcal/core';

/** Semantic version of the public surface (Phase 10 — membership + policies). */
export const NEWCAL_CORE_VERSION = '0.7.0' as const;

export * from './time/iana.js';
export * from './time/utc-instant.js';
export * from './time/zoned.js';

export * from './model/ids.js';
export * from './model/user.js';
export * from './model/calendar.js';
export * from './model/membership.js';
export * from './model/event.js';

export * from './store/types.js';
export * from './store/state.js';
export * from './store/query.js';
export * from './store/commands.js';

export * from './policies/calendar-permissions.js';

export * from './layout/overlap-column.js';

export * from './week/config.js';
export * from './week/grid-math.js';
export * from './week/range.js';
export * from './week/clip.js';
export * from './week/minutes.js';
export * from './week/instant-from-day.js';
