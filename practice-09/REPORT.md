# Practice 09 Report

## Changed files

- `AGENTS.md` (new): project notes, acceptance criteria AC1-AC6, change rules, commands.
- `src/lib/booking.ts`: exports `MAX_BOOKING_MINUTES = 120`; the 120-minute guard and its message use it. Message text is unchanged.
- `src/App.tsx`: imports `MAX_BOOKING_MINUTES` for the duration warning and the "exceeds the 120-minute limit" text. Rendered text is unchanged.
- `src/lib/booking.test.ts`: T01-T19 untouched. Added `deepFreeze` helper, T20 (past start) and T21 (deep-frozen fixture). Total is now 21.
- `practice-09/evidence/`: before/after command output, copies of originals, and diffs.

## Rationale (word count: about 120)

The booking rule is already a pure function with the current time passed in, so the rule and the page are separated without extra structure. The only real problem was the 120-minute limit being typed twice, once in the rule and once in the page warning. Moving it to one exported constant removes that drift risk and leaves every message and visible behavior identical. No patterns were added. An adapter or strategy would add indirection for a single rule with one caller. The test changes add coverage for past starts and confirm the rule does not mutate frozen input, supporting AC1 and AC5. Existing tests were not weakened.

## AC to test mapping

| AC | Requirement | Tests |
|----|-------------|-------|
| AC1 | Start later than current time; same-day order; range 0-1440 | T02, T03, T04, T05, T16, T18, T19, T20 |
| AC2 | 120-minute cap, inclusive | T06 (120 allowed), T07 (121 rejected) |
| AC3 | Blocked room unavailable | T13 |
| AC4 | Overlap rejected, touching allowed | T08, T09, T10, T11, T12, T14, T15, T17 |
| AC5 | Inputs and fixtures not mutated | Snapshot checks in T01-T19; T21 deep-frozen fixture |
| AC6 | Responsive UI feedback | Not covered by unit tests; manual/screenshot review |

## Results

- Before: typecheck exit 0; 19 tests passed; build exit 0.
- After: typecheck exit 0; 21 tests passed; build exit 0.
- Output files: `practice-09/evidence/before-*.txt`, `after-*.txt`, `diff-*.diff`.

## A/B prompts and reflection

- **Prompt A** (previous turn): inspection only, identify up to three maintainability problems, recommend zero to two patterns. Response: three problems (duplicated limits in UI, duplicated fixtures, text in domain logic) and zero patterns recommended.
- **Prompt B** (this turn): create AGENTS.md, share the limit constant, add tests, save evidence. Response: the changes above.
- Reflection: A's recommendation (zero patterns, shared constant) was followed in B. A's third problem (display text in the rule) was not addressed and is still present.

## Limitations

- Same-chat limitation: A and B ran in one conversation, so B had A's context. This is not a clean comparison.
- Model and version: unknown; not verified in this environment.
- AC6 is not tested automatically, and no screenshots were taken. Screenshots are to follow separately.
- AGENTS.md is a plain project file. I have not verified that any tool loads it automatically.
- The test count of 19 was preserved; the two added tests bring the total to 21.
- Not published.
