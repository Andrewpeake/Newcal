# Newcal

Cross-platform calendar (web first). Shared logic lives in [`@newcal/core`](./packages/core/README.md); persistence adapters in [`@newcal/data`](./packages/data/README.md); the web app is in [`apps/web`](./apps/web).

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9 (`corepack enable` or install globally)

## Setup

```bash
pnpm install
```

## Scripts (repo root)

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `pnpm dev`        | Start the **web** app (Vite) in dev mode         |
| `pnpm build`      | Build all packages (`turbo`)                     |
| `pnpm test`       | Run all tests (`turbo`)                          |
| `pnpm lint`       | Lint all packages (`turbo`)                      |
| `pnpm format`     | Format with Prettier                             |
| `pnpm format:check` | Check formatting                               |
| `pnpm test:e2e`   | Playwright E2E (Chromium; run `pnpm build` first) |
| `pnpm ci`         | `lint` → `build` → `test` → `test:e2e` (CI gate)   |

First-time E2E: after `pnpm install`, run `cd apps/web && npx playwright install chromium`.

## Run the web app

From the repository root:

```bash
pnpm dev
```

Or from `apps/web`:

```bash
pnpm --filter web dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

## Progress

- **Phase 0:** Monorepo scaffold, strict TypeScript, ESLint + Prettier, Turborepo, `@newcal/core` public entry + tests, minimal React + Vite shell.
- **Phase 1:** UTC instants + IANA display time (`America/Edmonton` default), `User` / `Calendar` / `Event`, normalized `NewcalState`, `queryEventsInRange`, DST + validation tests in `@newcal/core`.
- **Phase 2:** `applyCommand` / `CalendarCommand`, overlap layout `layoutSingleDayColumn` with tests.
- **Phase 3:** React Router, Zustand `useCalendarStore` with `dispatch(command)` → `applyCommand`, seeded user/calendar, debug UI on `/debug`.
- **Phase 4:** `@newcal/core` week helpers (`getIsoWeekRangeUtc`, grid math, clip, overlap per column); **`/`** = week grid (Mon–Sun, vertical scroll, prev/next/today), two seeded demo events; **`/debug`** = mock controls; **`apps/web`** Vitest + RTL (`App.test.tsx`).
- **Phase 5:** Week interactions (drag-to-create, move, resize, edit modal) via `dispatch` → `applyCommand`; `utcInstantAtMinutesOnCalendarDay` in core.
- **Phase 6:** Week grid **horizontal + vertical** scroll in one pane; **sticky** time gutter and top-left corner; **three ISO weeks** (prev · anchor · next) in one strip with a **union event query**; toolbar shows the visible date span; **anchor week** recenters horizontally when changing `weekOffsetWeeks`; **week-level** horizontal scroll snap (not per-day).
- **Phase 7:** **Zoom** — single **zoom factor** scales **vertical** hour height (`pixelsPerMinute`) and **horizontal** day column width (`rem`) together; min/max clamp; **viewport-center anchor** in content space after zoom; **⌃/⌘ + wheel** on the schedule plus toolbar **− / +**.
- **Phase 8:** **Day view** (`/day`, optional `?date=yyyy-MM-dd`) — single-column schedule reusing **`DayColumn`** + **`dispatch`**; **Month view** (`/month`, `year` / `month` query) — minimal event list per cell, **day number links to Week** with computed `weekOffset`. Same Zustand store everywhere.
- **Phase 9:** **Offline persistence (v1)** — **`@newcal/data`** exposes a **`CalendarStateRepository`** port; **`createIdbCalendarStateRepository()`** stores Zustand persist blobs in **IndexedDB** (`newcal` / `calendarKv`), with **one-time migration** from legacy **`localStorage`** keys. **`weekOffset`** URL behavior unchanged.
- **Phase 10:** **Shared calendars (local-first)** — **`CalendarMembership`** stubs + **`userCanEditCalendar`** policy; **`applyCommand(state, command, { actorUserId })`** returns **`PERMISSION_DENIED`** when **`canEdit`** is false; seed **read-only shared** calendar + Debug action to verify.
- **Phase 11 (hardening):** **`@newcal/core`** tests (overlap column, range query half-open, DST, permission-denied commands); **`inputPolicy`** stub + unit tests in **`apps/web`**; Playwright smoke (**/`**, **`/debug`**, week drag-to-create); **`pnpm ci`** runs lint, build, unit tests, and E2E.

### Roadmap checklist (Phases 0–6)

| Area | Status |
|------|--------|
| pnpm monorepo, TS strict, ESLint, Prettier, turbo | Done |
| `@newcal/core` single public `index.ts`, no React/DOM in core | Done |
| Time + entities + store + commands + overlap layout + tests | Done |
| Web shell, Zustand `dispatch`, `/debug` | Done |
| Week grid, seeded events, overlap rendering | Done |
| Drag create, move, resize, modal | Done |
| Horizontal scroll + sticky chrome + 3-week strip | Done |
| “Infinite” horizontal weeks (Prompt 16) | **Not yet** — fixed **3-week** buffer + prev/next semantics |
| Snap to **day** (Prompt 17) | **Different** — snap to **ISO week** (Monday columns) + one-week viewport cap |
| Playwright / E2E (Prompts 13–15) | Done — smoke + debug + week drag (Phase 11) |
