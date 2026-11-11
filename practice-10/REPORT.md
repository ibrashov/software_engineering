# Practice 10 Report

## Changed files

- `src/lib/booking.ts`: added nonfinite guard at the top of `checkAvailability` rejecting NaN/Infinity/-Infinity for start, end, and currentTime.
- `src/lib/booking.test.ts`: T01-T21 retained unchanged. Added T22-T30 (nine regression tests covering NaN/Infinity/-Infinity for start, end, and currentTime, each asserting fixtures unchanged).
- `README.md` (new): setup with `npm ci`, command table, scope description, observed Node version, reproducibility caveat.
- `AGENTS.md`: NOT modified. Proposal saved at `practice-10/evidence/AGENTS-proposal.md` awaiting approval.
- `practice-10/evidence/`: original file copies, failing-before and after command outputs, diffs, Node version, npm ci dry-run, AGENTS proposal.

## Constraint comparison (AGENTS.md vs. code)

- One fictional room: confirmed — only "Library Study Room B-12" in both `App.tsx:18-21` and `booking.test.ts:15`.
- No login/database: confirmed — no Supabase imports in source, no auth code, no persistence calls.
- AC1-AC6 preserved: confirmed — guard is placed before existing logic; all 21 original tests pass unchanged.
- No secrets: confirmed — no credentials in source; `.gitignore` excludes `.env`.
- No external deployments: confirmed — no deployment config, no outbound API calls.
- Tests before acceptance: confirmed — failing-before evidence captured, then guard added, then all checks rerun.

## Failing-before evidence

| Command | Exit | Result |
|---------|------|--------|
| `npm run typecheck` | 0 | No type errors (tests are type-safe; the bug is runtime logic) |
| `npm test` | 1 | 9 failed (T22-T30), 21 passed (T01-T21) |

Key failures: T22 (NaN start) returned `{ available: true }` — the function accepted NaN as valid. T28 (NaN currentTime) also returned true. T29 (Infinity currentTime) produced reason "Booking must be in the future — current time is Infinity:NaN." These confirm F03: nonfinite inputs bypassed all guards because every NaN comparison evaluates false.

Full output: `practice-10/evidence/failing-before-test.txt`.

## After guard added

| Command | Exit | Result |
|---------|------|--------|
| `npm run typecheck` | 0 | No errors |
| `npm test` | 0 | 30 tests passed (T01-T30) |
| `npm run lint` | 0 | No errors |
| `npm run build` | 0 | 1569 modules, built in 1.55s |

Full output: `practice-10/evidence/after-*.txt`.

## Corrected findings register (>=5 risks, >=3 categories)

| ID | Category | Status | Cause → Event → Consequence | Component | Evidence | Uncertainty | L | I | Score | Justification | Mitigation | Owner | Verification |
|----|----------|--------|----------------------------|-----------|----------|-------------|---|---|-------|---------------|-----------|-------|--------------|
| F01 | Reliability | Confirmed | No CI pipeline → gates depend on human discipline → a developer can skip checks before merge | Project root | No `.github/workflows`, no husky, no lint-staged found via glob | Low — exhaustive search | 2 | 2 | **4** | Commands exist and pass but nothing enforces them; absence of automation does not prove merges will be bad, only that they can be | Add CI workflow (not in scope this practice) | Developer | Glob for CI configs |
| F03 | Correctness | Confirmed (demonstrated) | No nonfinite validation in `checkAvailability` → NaN/Infinity bypass all comparisons → function returns `{ available: true }` for invalid inputs | `booking.ts:34-82` (pre-guard) | 9 tests failed before guard; T22 returned true for NaN start | Low — demonstrated with failing tests, now fixed | 1 | 2 | **2** | Fixed this practice: guard added, 9 regression tests pass | Guard at `booking.ts:35-42`; tests T22-T30 | Developer | `npm test` shows 30 passed |
| F04 | Maintainability | Confirmed | No README → no entry point for new contributors → onboarding relies on reading AGENTS.md and source | Project root | Glob found no root README | Low — glob confirmed | 2 | 1 | **2** | Fixed this practice: README.md created with setup, commands, scope | README.md created | Developer | `ls README.md` |
| F06 | Reliability | Confirmed | `npm run typecheck` only checks `tsconfig.app.json` (includes `src/`) → `vite.config.ts` not typechecked → config type errors undetected | `package.json:12`, `tsconfig.app.json:29`, `tsconfig.node.json:21` | typecheck script runs only app config; node config exists but no script invokes it | Low — configs read directly | 2 | 1 | **2** | `tsconfig.node.json` exists for vite.config but is never run | Add `typecheck:node` script (not in scope this practice) | Developer | Inspect package.json scripts |
| F05 | Maintainability | Plausible | Independent fixtures in App.tsx and tests → could drift → mismatched expectations | `App.tsx:18-21`, `booking.test.ts:15` | Both define same room independently | Medium — independent fixtures can also serve as cross-validating oracles; drift risk is low at current size | 1 | 1 | **1** | Not a confirmed risk; noted as low-value observation | No action needed unless fixtures diverge | Developer | Grep for room name |
| F07 | Maintainability | Unsupported (retracted) | Array index as React key → potential list render bugs | `App.tsx:119` | `key={i}` on bookings list | High — bookings are never reordered; risk is latent and theoretical | 1 | 1 | **1** | Retracted: bookings are static, no reordering logic exists; risk does not materialize in current code | No action needed | Developer | Read App.tsx |
| F08 | Agent ops | Confirmed | AGENTS.md test count stale (says T01-T19, suite has T01-T30) → agent reads incomplete count → minor confusion, but NOT a prohibition on additions | `AGENTS.md:13` | File says "T01-T19 must stay"; suite has 30 tests | Low — text read directly | 1 | 1 | **1** | "Must stay" is a floor not a ceiling; does not forbid T20-T30. Count is inaccurate but not harmful. | Update count (proposal saved, not applied) | Developer | Diff AGENTS.md vs test file |

### Challenged statuses across 3 categories

- **Reliability (F01):** L revised from 3 to 2. Missing CI means gates are manual, not that bad merges are likely. The consequence is "depends on human discipline," not "will likely produce bad merges."
- **Correctness (F03):** Confirmed and demonstrated. Nine failing tests before the guard proved the bug exists. Now fixed.
- **Agent ops (F02/F08):** Original F02 retracted. "T01-T19 must stay" does not forbid T20-T21 or T20-T30. The consequence I claimed (agent believes adding tests is forbidden) is unsupported by the text. Recast as F08: stale count, low impact, not a prohibition violation.

## Audit readiness

**Level 2 (repeatable, human-supervised).** Justification: the four checks (typecheck, test, lint, build) exist as npm scripts, are documented in AGENTS.md and README.md, pass consistently, and were run in the correct order with real output captured both before (failing) and after (passing). Level 2 does not require automation — human-supervised repeatability is satisfied.

**Gaps to Level 3 (isolated automated gates):**
- No CI pipeline (F01, score 4) — primary blocker.
- No isolated execution environment for gates.
- No coverage threshold or component/DOM tests.
- `vite.config.ts` not covered by `npm run typecheck` (F06, score 2).

## Two mitigations and residual scores

### Mitigation 1: Nonfinite guard (F03)
- **Action:** Added `Number.isFinite` guard for start, end, and currentTime at the top of `checkAvailability`, before the range check. Added 9 regression tests (T22-T30) covering NaN, Infinity, and -Infinity for each parameter.
- **Residual score:** L1 × I1 = **1**. The guard handles the exported function's direct callers. Residual risk: the UI's `labelToMinutes` could still produce NaN from malformed input if the function were called with a non-select value, but the selects constrain input to valid time strings. No UI edits were made.

### Mitigation 2: README (F04)
- **Action:** Created `README.md` with setup (`npm ci`), command table, scope description, observed Node v22.23.1, and a note that clean-install reproducibility was not separately tested.
- **Residual score:** L1 × I1 = **1**. The README is accurate to current state but is a static document; it can drift if the project changes. No automation enforces its accuracy.

## Task 09: Isolated change procedure

- **Branch:** Work should be done on an isolated branch (e.g., `practice-10-fixes`), not on the baseline.
- **Allowed files:** `src/lib/booking.ts`, `src/lib/booking.test.ts`, `README.md`, `practice-10/**`. AGENTS.md is NOT approved for modification this practice.
- **Allowed commands:** `npm ci`, `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`.
- **Prohibited actions:** No CI/dependency updates, no refactoring beyond the minimal guard, no deployment, no UI edits, no AGENTS.md modification, no publishing.
- **Diff/test/build/review evidence:** Saved under `practice-10/evidence/` — original file copies, failing-before typecheck/test output, after typecheck/test/lint/build output, unified diffs for all three changed files, AGENTS proposal.
- **Human merge/deploy gates:** A human must review the diffs, confirm the checks pass, and approve before any merge or deploy. No automated merge or deploy was performed. Not published.

## Manual UI verification

**NOT RUN.** No browser checks were performed in this practice. The user's prior browser verification (Practice 09) covered desktop 1440x1000, mobile 390x844, and reversed-order input. Those results are not re-verified here. Pending the user's browser check for this practice's changes (the guard is invisible to the UI since nonfinite values cannot be selected).

## Remaining uncertainties

- **Model/version:** Unknown; not verified in this environment.
- **Clean-install reproducibility:** `npm ci --dry-run` succeeded but a full clean install was not performed. Noted in README.
- **F05 (independent fixtures):** Whether this is a real drift risk or a beneficial oracle pattern is unresolved. No action taken.
- **F07 (array index key):** Retracted as unsupported but not formally tested for list-render correctness.
- **AGENTS.md proposal:** Not applied. The test-count update and new prohibitions await user approval.
- **`vite.config.ts` typechecking:** F06 remains unmitigated; no `typecheck:node` script was added (out of scope).
