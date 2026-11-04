# Practice 09 Report

## Changed files

- `AGENTS.md` (new): project notes, acceptance criteria AC1-AC6, change rules, commands.
- `src/lib/booking.ts`: exports `MAX_BOOKING_MINUTES = 120`; the 120-minute guard and its message use it. Message text is unchanged.
- `src/App.tsx`: imports `MAX_BOOKING_MINUTES` for the duration warning and the "exceeds the 120-minute limit" text. Rendered text is unchanged.
- `src/lib/booking.test.ts`: T01-T19 untouched. Added `deepFreeze` helper, T20 (past start) and T21 (deep-frozen fixture). Total is now 21.
- `practice-09/evidence/`: before/after command output, copies of originals, and diffs.
- `practice-09/REPORT.md`: this report.

## AGENTS.md summary

- Scope: one fictional room, no backend, login, saving, or new features.
- Structure: rule in `booking.ts`, page in `App.tsx`, tests in `booking.test.ts` (T01-T19 must stay).
- Acceptance criteria AC1-AC6 as listed below.
- Change rules: keep the rule pure, at most two justified patterns, share limits through exported constants, preserve UI text and behavior, never weaken tests.
- Commands, in order: `npm run typecheck`, `npm test`, `npm run build`.
- Provenance: I created AGENTS.md in the previous turn. There was no existing file to read before editing, and I have not verified that any tool loads it automatically.

## Rationale

The 120-minute limit was written in two places, so the rule and the page warning could drift apart. Sharing one exported constant between them, with no new patterns, removes that risk while keeping every message and behavior identical.

## Reflection

- Why zero patterns reduced complexity: the booking rule is already a pure function that receives the current time, so the rule and the page are already separated. An adapter or strategy would add files and indirection for one rule with one caller, and would not change any behavior.
- Unrequested changes: none to source beyond the requested constant, helper, and two tests. Two side effects to note: `npm run build` regenerated the `dist/` bundle (its JavaScript file name changed), and one shell command changed the working directory into `practice-09/evidence` before I returned to the project root.
- Effect of explicit instructions: the request to keep T01-T19 and preserve UI text made the change narrow. The request for zero patterns was followed. Without that instruction, the earlier review's suggestion of a shared fixture module could have grown the change.
- Evidence preserving behavior: the before and after typecheck, test, and build outputs, plus the diffs, are in `practice-09/evidence/`. Tests went from 19 to 21 passing; the two new tests were added and the 19 originals are unchanged. The diff for `App.tsx` shows only the constant swap.

## AC to test mapping

| AC | Requirement | Tests |
|----|-------------|-------|
| AC1 | Start later than current time; same-day order; range 0-1440 | T02, T03, T04, T05, T16, T18, T19, T20 |
| AC2 | 120-minute cap, inclusive | T06 (120 allowed), T07 (121 rejected) |
| AC3 | Blocked room unavailable | T13 |
| AC4 | Overlap rejected, touching allowed | T08, T09, T10, T11, T12, T14, T15, T17 |
| AC5 | Inputs and fixtures not mutated | Snapshot checks in T01-T19; T21 deep-frozen fixture |
| AC6 | Responsive UI feedback | Not covered by unit tests; browser check below |

## Results (command output, run by me)

- Before: typecheck exit 0; 19 tests passed; build exit 0.
- After: typecheck exit 0; 21 tests passed; build exit 0.
- Output files: `practice-09/evidence/before-*.txt`, `after-*.txt`, `diff-*.diff`.

## Browser verification (reported by the user, not run by me)

- Desktop, 1440x1000: 11:00-12:00 shows Available.
- Mobile, 390x844: 10:30-11:30 shows Unavailable due to overlap; no horizontal overflow (scrollWidth 390).
- Reversed order, 12:00 to 11:30: the inline warning is visible and the result is Unavailable with the ordering reason.
- Screenshots: supplied in the submission package, not in this repository.
- Live URL: https://study-room-booking-p-yq12.bolt.host

No source changes were needed for these checks.

## A/B prompts and reflection

- **Prompt A** (inspection turn): inspection only, identify up to three maintainability problems, recommend zero to two patterns. Response: three problems (duplicated limits in UI, duplicated fixtures, display text in the rule) and zero patterns recommended.
- **Prompt B** (build turn): create AGENTS.md, share the limit constant, add tests, save evidence. Response: the changes above.
- Reflection: A's recommendation of zero patterns and a shared constant was followed in B. A's duplicated-fixture problem was not addressed, and A's display-text problem was not addressed either; both remain.

## Limitations

- Same-chat limitation: A and B ran in one conversation, so B had A's context. This is not a clean comparison.
- Model and version: unknown; not verified in this environment.
- AC6 is not tested by the unit suite. The browser results above were reported by the user.
- The test count of 19 was preserved; the two added tests bring the total to 21.
- Not published.
