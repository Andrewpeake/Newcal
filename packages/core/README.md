# `@newcal/core`

Calendar **domain engine** and **public types** for Newcal.

## Import rules

- Import only from the package root: `import { … } from '@newcal/core'`.
- Do not deep-import internal files; they are not part of the stable API.
- This package must **not** depend on React or DOM APIs (enforced by ESLint in the monorepo root).

## Phase 1 — time & model

- **Time:** Event bounds use **`UtcInstantMs`** (UTC epoch ms). Display and DST use **Luxon** with IANA zones; default display zone is **`America/Edmonton`** (`DEFAULT_DISPLAY_TIMEZONE`).
- **Entities:** `User`, `Calendar` (`CalendarKind`: personal | shared | workspace), `Event` (with `displayTimeZone`).
- **Validation:** `tryCreateEvent` / `validateEventFull` enforce `end > start` and a valid IANA id.
- **Store:** `NewcalState` (`usersById`, `calendarsById`, `eventsById`, `eventIdsByCalendarId`, `calendarMembershipsByKey`), `createEmptyState`, `queryEventsInRange`.

## Phase 2 — commands & overlap layout

- **Commands:** `CalendarCommand` (`createEvent`, `updateEvent`, `moveEvent`, `resizeEvent`, `deleteEvent`) and pure **`applyCommand(state, command, context)`** → `ApplyCommandResult` (immutable state updates, validation, calendar index maintenance). **`ApplyCommandContext`** carries **`actorUserId`** (Phase 10).
- **Layout:** **`layoutSingleDayColumn(events)`** → `OverlapPlacement[]` (connected overlap components + greedy column assignment, Apple-style equal-width columns).

`luxon` is a runtime dependency; `@types/luxon` is used so `moduleResolution: NodeNext` resolves typings cleanly under `tsc`.

## Phase 4 — week grid math (web consumes, no DOM in core)

- **Config:** `WEEK_VISIBLE_DAYS`, `MINUTES_PER_DAY`.
- **Grid:** `VerticalTimeScale`, `dayGridHeightPx`, `minutesFromDayStartFromContentY`, `contentYFromMinutesFromDayStart`.
- **Range:** `getIsoWeekRangeUtc`, `getDayColumnBoundsUtc` (Monday-start week in a zone).
- **Clip:** `clipEventToDayColumn`, `durationMinutesFromUtcSpan`.
- **Local minutes:** `minutesFromMidnightForUtcInZone`.

## Phase 5 — wall-clock instants on a day (web consumes)

- **`utcInstantAtMinutesOnCalendarDay(dayStartUtc, minutesFromMidnight, zone)`** — Luxon-based instant on a civil day in a zone (clamped to the day). Used by the web week grid for create/resize.

## Phase 6 — version / web alignment

- **`NEWCAL_CORE_VERSION`** tracks the public surface; Phase 6 shipped with web week UX (horizontal scroll + sticky chrome). No new calendar APIs beyond Phase 5 in core.

## Phase 7 — web zoom (not in core)

- The **web app** applies a **zoom factor** to **`pixelsPerMinute`** and day column width so hour height and day width scale together; anchor preservation is a DOM concern. **`@newcal/core`** still exposes only scale-agnostic grid math (`dayGridHeightPx`, etc.).

## Phase 8 — day + month (not in core)

- **Web:** `/day` and `/month` routes share **`@newcal/core`** queries and **`applyCommand`** via the same store as Week.

## Phase 9 — persistence (not in core)

- **`@newcal/data`** holds IndexedDB adapters. Web uses **`CalendarStateRepository`** + Zustand **`persist`**.

## Phase 10 — membership & edit policy

- **`CalendarMembership`** (role stub + **`canEdit`**) stored in **`calendarMembershipsByKey`** (see **`calendarMembershipLookupKey`**).
- **`userCanEditCalendar(state, actorUserId, calendarId)`** — calendar **owner** always may edit; otherwise **`canEdit`** on membership.
- **`applyCommand`** enforces edit rights for all event mutations; failures return **`PERMISSION_DENIED`**.
