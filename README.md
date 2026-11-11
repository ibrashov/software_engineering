# Smart Campus Room Checker

A single-page prototype for checking whether one fictional study room ("Library Study Room B-12") is available for a requested time interval. No backend, login, or data persistence.

## Setup

```sh
npm ci
```

Requires Node.js. Verified with Node v22.23.1 on Linux. Clean-install reproducibility was not separately tested.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run typecheck` | TypeScript check (run first) |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run dev` | Dev server |

## Scope

- One fictional room, no database, no login, no saving of bookings.
- The current time is a fixed demo value (09:00) — not a live clock.
- The booking rule (`src/lib/booking.ts`) is a pure function; the page (`src/App.tsx`) only calls it and displays the result.
- Acceptance criteria AC1-AC6 and change rules are documented in `AGENTS.md`.
