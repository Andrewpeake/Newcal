# `@newcal/data`

Persistence adapters for Newcal apps (IndexedDB today; SQLite WASM or other backends later).

- **`CalendarStateRepository`** — key–value string API for serialized store blobs.
- **`createIdbCalendarStateRepository()`** — IndexedDB `newcal` / `calendarKv` implementation.

Domain types and commands remain in **`@newcal/core`**. The web app wires Zustand **`persist`** to this package.
