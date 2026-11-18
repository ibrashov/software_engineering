# Smart Campus Room Checker - Agent Notes

## Scope

A single prototype page for one fictional room: "Library Study Room B-12".
Visitors pick a start and end time and see whether the room is free.
Out of scope: backend, login, saving bookings, and new features. The page does not save or modify data.

## Structure

- `src/lib/booking.ts` - pure booking rule (`checkAvailability`) and time helpers. Owns `MAX_BOOKING_MINUTES` (120).
- `src/App.tsx` - the page. Calls the rule, shows warnings and results. Holds no booking logic beyond display.
- `src/lib/booking.test.ts` - unit tests for the rule. Cases T01-T19 must stay.
- `src/lib/mockExplain.ts` - mock explanation generator. Worded from the checker's known reasons only.
- `src/lib/mockExplanation.ts` - browser client for the `explain-availability` edge function.
- `src/lib/mockExplain.test.ts` - unit tests for the mock explanation (E01-E09).
- `supabase/functions/explain-availability/` - server-side adapter. Validates request shape, returns `{ explanation, source: "mock-ai" }`. No external API is called; no secrets are used.
- `supabase/functions/_shared/explainMock.ts` - the same generator as `src/lib/mockExplain.ts`, kept in sync manually (Deno functions cannot import from `src/`).

## Acceptance criteria

- AC1: Start must be later than the current time (09:00) and must be before end on the same day. Times stay within 0-1440 minutes.
- AC2: Duration cap is 120 minutes, inclusive (120 is allowed, 121 is not).
- AC3: A blocked room is never available.
- AC4: Overlapping an existing booking is rejected. Touching endpoints is allowed.
- AC5: Fixtures and inputs are never mutated by the rule.
- AC6: The page gives clear, responsive feedback for available, unavailable, and invalid input states.

## Rules for changes

- Keep the rule as a pure function. Do not add adapters, strategies, or other patterns unless a concrete need appears. At most two patterns, each justified in writing.
- Share limits through exported constants (`MAX_BOOKING_MINUTES`) rather than repeating numbers in the UI.
- Preserve existing UI text and behavior unless a change is requested.
- Do not weaken or delete tests to make them pass.
- The deterministic checker (`checkAvailability`) is authoritative. The mock explanation is display-only and must never change the confirmed result.
- Never call a real LLM API from the browser. All model/secret traffic goes through a server-side adapter (edge function).
- Do not add login, a database, or real personal data to this prototype.
- Keep the explanation labeled as "Mock AI" in the UI.

## Commands

- `npm run typecheck` - TypeScript check (run first).
- `npm test` - Vitest unit tests.
- `npm run build` - production build.
