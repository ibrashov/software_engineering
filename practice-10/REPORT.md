# Practice 10 — Final Report

## Tasks 1-9 mapping

| Task | Description | Status |
|------|-------------|--------|
| T01 | File inventory and constraints | Done — all project files read; AGENTS.md, package.json, tsconfigs, eslint, source, tests, configs |
| T02 | Identify scope, constraints, scripts | Done — one fictional room, no backend/login/database, AC1-AC6, scripts: typecheck/test/lint/build/dev/preview |
| T03 | Run commands and capture actual output | Done — baseline 21 pass, failing-before 9 fail, after guard 30 pass, all gates green |
| T04 | Findings register (>=5 risks, >=3 categories) | Done — 6 genuine risks across reliability, correctness, maintainability, agent-ops, security |
| T05 | Audit readiness assessment | Done — Level 2 with justified gaps to Level 3 |
| T06 | Documentation-only review, show patches, await approval | Done — AGENTS.md proposal saved, not applied |
| T07 | Apply approved changes (guard + tests + README) | Done — guard added, 9 tests added, README created |
| T08 | Capture evidence (originals, failing-before, after, diffs) | Done — all under practice-10/evidence/ |
| T09 | Isolated change procedure, allowed/prohibited, gates, human merge | Done — documented below |

## Changed files

- `src/lib/booking.ts`: nonfinite guard at lines 35-44, rejecting NaN/Infinity/-Infinity for start, end, currentTime.
- `src/lib/booking.test.ts`: T01-T21 retained unchanged. T22-T30 added (9 regression tests).
- `README.md` (new): setup with `npm ci`, command table, scope, observed Node v22.23.1, reproducibility caveat.
- `AGENTS.md`: NOT modified. Proposal saved at `practice-10/evidence/AGENTS-proposal.md`.

## Independent review of current source

Downloaded originals and current `booking.ts`, `App.tsx`, and scripts were reviewed independently.

**Guard confirmed:** `booking.ts:35-44` checks `!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(currentTime)` before any other logic. Returns `{ available: false, reason: "Start, end, and current times must be valid finite numbers." }`.

**Order-independent loop confirmed:** `booking.ts:81-88` iterates `for (const b of room.bookings)` checking `start < b.end && b.start < end` for every booking. This is a full linear scan — overlap is detected regardless of array order. No sorting is needed.

**No UI edits:** `App.tsx` is byte-identical to the practice-09 version. No selectors, form logic, or rendering changed.

## Baseline and current test counts

| State | Tests | Result |
|-------|-------|--------|
| Baseline (before this practice) | 21 | All pass |
| Failing-before (tests added, no guard) | 30 | 9 failed, 21 passed |
| Current (guard added) | 30 | All pass |

## Failing-before evidence — corrected analysis

Full output: `practice-10/evidence/failing-before-test.txt`. Typecheck passed (exit 0); tests failed (exit 1).

The 9 failures break into two distinct categories:

**4 tests returned `available: true` (nonfinite accepted as valid):**
- T22 (NaN start): returned true — NaN bypassed all guards because every NaN comparison is false.
- T25 (NaN end): returned true — same mechanism.
- T28 (NaN currentTime): returned true — `start <= currentTime` is false when currentTime is NaN.
- T30 (-Infinity currentTime): returned true — `-Infinity` made `start <= currentTime` false (660 <= -Infinity is false).

**5 tests returned `available: false` but with wrong reason (caught by downstream guard, not a nonfinite check):**
- T23 (Infinity start): returned "Start time must be before end time." — `Infinity >= 600` is true.
- T24 (-Infinity start): returned "Times must stay within the 00:00-24:00 range" — `-Infinity < 0` is true.
- T26 (Infinity end): returned "Times must stay within the 00:00-24:00 range" — `Infinity > 1440` is true.
- T27 (-Infinity end): returned "Start time must be before end time." — `600 >= -Infinity` is true.
- T29 (Infinity currentTime): returned "Booking must be in the future — current time is Infinity:NaN." — `minutesToLabel(Infinity)` produced "Infinity:NaN".

**Correction of prior overclaim:** The earlier report stated "not all Infinity accepted" is wrong in the opposite direction — it implied all Infinity was accepted. In reality, NO Infinity input was accepted as available. All 5 Infinity/-Infinity tests returned unavailable, but for the wrong reason and via the wrong code path. The 4 NaN tests were the ones that returned available: true. The bug is: nonfinite inputs are not rejected explicitly, so they fall through to guards that produce misleading reasons (Infinity) or bypass all guards entirely (NaN).

## After guard — actual command output

| Command | Exit | Result | Evidence file |
|---------|------|--------|---------------|
| `npm run typecheck` | 0 | No errors | `after-typecheck.txt` |
| `npm test` | 0 | 30 passed | `after-test.txt` |
| `npm run lint` | 0 | No errors | `after-lint.txt` |
| `npm run build` | 0 | 1569 modules, 1.55s | `after-build.txt` |

## Constraint comparison (AGENTS.md vs. code)

- One fictional room: confirmed — "Library Study Room B-12" in `App.tsx:19` and `booking.test.ts:15`.
- No login/database: confirmed — no Supabase imports in source, no auth code, no persistence calls.
- AC1-AC5 preserved: confirmed — all 21 original tests pass unchanged; guard is before existing logic.
- AC6 (clear responsive UI feedback): NOT proven by unit tests. Unit tests cover the pure function only. The human browser check (below) partially verifies AC6 for three input states. A full AC6 audit requires component/DOM tests or comprehensive manual testing.
- No secrets: no credentials observed in source files; `.gitignore` excludes `.env`. This is observation, not proof — see F10.
- No external deployments: no deployment config in project files. The existence of a historically hosted Bolt preview is NOT proof of no deployments; it is evidence of a hosted preview environment, which is distinct from the project's own deployment posture.

## Corrected findings register (6 genuine risks, 5 categories)

| ID | Category | Status | Cause -> Event -> Consequence | Component | Evidence | Uncertainty | L | I | Score | Justification | Mitigation | Owner | Verification |
|----|----------|--------|------------------------------|-----------|----------|-------------|---|---|-------|---------------|-----------|-------|--------------|
| F01 | Reliability | Confirmed | No CI pipeline -> gates depend on human discipline -> checks can be skipped before merge | Project root | No `.github/workflows`, no husky, no lint-staged found via glob | Low — exhaustive search | 2 | 2 | **4** | Commands exist and pass but nothing enforces them; absence of automation does not prove bad merges, only that they are possible | Add CI workflow (out of scope this practice) | Developer | Glob for CI configs |
| F03 | Correctness | Confirmed, fixed | No nonfinite validation -> NaN bypasses all comparisons, Infinity hits wrong guard -> function returns true for NaN or misleading reason for Infinity | `booking.ts:35-44` (pre-guard) | 4 tests returned available:true for NaN; 5 returned wrong reason for Infinity/-Infinity | Low — demonstrated with failing tests, now fixed | 1 | 2 | **2** | Fixed: guard added, 9 regression tests (T22-T30) pass | Guard at `booking.ts:35-44`; tests T22-T30 | Developer | `npm test` shows 30 passed |
| F04 | Maintainability | Confirmed, fixed | No README -> no entry point for new contributors -> onboarding relies on reading AGENTS.md and source | Project root | Glob found no root README before this practice | Low — glob confirmed | 2 | 1 | **2** | Fixed: README.md created with setup, commands, scope, Node version, reproducibility caveat | README.md created | Developer | `ls README.md` |
| F06 | Reliability | Confirmed | `npm run typecheck` only checks `tsconfig.app.json` -> `vite.config.ts` not typechecked -> config type errors undetected | `package.json`, `tsconfig.app.json`, `tsconfig.node.json` | typecheck script runs only app config; node config exists but no script invokes it | Low — configs read directly | 2 | 1 | **2** | `tsconfig.node.json` exists for vite.config but is never run | Add `typecheck:node` script (out of scope) | Developer | Inspect package.json scripts |
| F09 | Reliability | Confirmed | No automated UI/component tests -> AC6 and rendering correctness unverified by automation -> UI regressions undetected | `src/lib/booking.test.ts` (only unit tests) | No DOM/component tests; test environment is node, not jsdom | Low — test config read | 2 | 2 | **4** | AC6 is a UI criterion; unit tests cannot verify it. Browser check partially covers but is manual and not repeatable in CI | Add component tests with jsdom + Testing Library (out of scope) | Developer | Inspect vitest config and test files |
| F10 | Agent ops / Security | Confirmed | AGENTS.md has no explicit prohibitions on secrets, real personal data, database connections, or external deployments -> agent could introduce these -> scope creep or data exposure | `AGENTS.md:24-29` (Rules for changes) | Rules section covers pure function, constants, UI text, tests — but no security/scope prohibitions | Medium — no observed leak, but no guardrail prevents future introduction | 2 | 2 | **4** | Distinct from "no observed credentials": the absence of a prohibition is not the presence of a safeguard. A hosted preview existing is not proof of no deployment capability | Add explicit prohibitions to AGENTS.md (proposal saved, not applied) | Developer | Read AGENTS.md Rules section |

### Challenged findings (5+ across 3 categories)

1. **Reliability — F01 (L revised):** Missing CI means gates are manual, not that bad merges are likely. L lowered from 3 to 2. The consequence is "depends on human discipline," not "will likely produce bad merges."
2. **Correctness — F03 (overclaim corrected):** The prior report implied all 9 failures showed nonfinite inputs accepted as available. In reality, only 4 of 9 returned `available: true` (the NaN cases). The 5 Infinity/-Infinity cases returned unavailable but with wrong reasons via wrong code paths. The bug is real but the characterization was imprecise.
3. **Agent ops — F08 (retired):** "Cases T01-T19 must stay" is a preservation floor, not an inaccurate count. It does not forbid T20-T30 and is not stale. F08 is retired; it is not a genuine risk.
4. **Maintainability — F05 (downgraded to observation):** Independent fixtures in App.tsx and tests can serve as cross-validating oracles. Drift risk is low at current size and may be beneficial. Not a genuine risk; noted as observation only.
5. **Reliability — F07 (retracted):** Array index as React key (`App.tsx:119`) is not a confirmed risk. Bookings are static, never reordered. The order-independent overlap loop confirms no sorting is needed. Retracted.

## Security and privacy assessment

**Scope:** Limited scan. Source files (`booking.ts`, `App.tsx`, `main.tsx`), config files (`vite.config.ts`, `tsconfig.*`, `eslint.config.js`, `postcss.config.js`, `tailwind.config.js`), `package.json`, `.gitignore`, and `AGENTS.md` were reviewed.

**Findings:**
- No credentials, API keys, or secrets observed in source or config.
- `.gitignore` excludes `.env`.
- No database connections, auth, or network calls in source.
- No user data collection, storage, or transmission.
- No third-party analytics or tracking scripts.
- `labelToMinutes` parses user-selected time strings from constrained `<select>` options — no free-text injection surface.

**Limitations:**
- This is a source-level scan, not a dependency audit or penetration test.
- `node_modules` was not scanned for known vulnerabilities.
- No runtime network analysis was performed.
- The absence of observed secrets is not proof that none could be introduced — see F10.

**Conclusion:** No demonstrated leak or exposure. The application is static and client-only with no data flow to any server. Security posture is adequate for a fictional supervised demo. The missing guardrail (F10) is the primary residual concern.

## Two mitigations and residual scores

### Mitigation 1: Nonfinite guard (F03)
- **Action:** Added `Number.isFinite` guard for start, end, and currentTime at the top of `checkAvailability` (`booking.ts:35-44`), before the range check. Added 9 regression tests (T22-T30) covering NaN, Infinity, and -Infinity for each parameter, each asserting fixtures unchanged.
- **Failing-before evidence:** 4 tests returned `available: true` for NaN inputs; 5 returned wrong reasons for Infinity/-Infinity. Full output at `practice-10/evidence/failing-before-test.txt`.
- **After evidence:** 30 tests pass. Full output at `practice-10/evidence/after-test.txt`.
- **Residual score:** L1 x I1 = **1**. The guard handles the exported function's direct callers. Residual risk: `labelToMinutes` in `App.tsx:24-27` could produce NaN from malformed input if called with a non-select value, but the selects constrain input to valid time strings. No UI edits were made.

### Mitigation 2: README (F04)
- **Action:** Created `README.md` with setup (`npm ci`), command table, scope description, observed Node v22.23.1, and a note that clean-install reproducibility was not separately tested.
- **Residual score:** L1 x I1 = **1**. The README is accurate to current state but is a static document; it can drift if the project changes. No automation enforces its accuracy.

## Top 2 action priorities

**Priority 1: F01 + F09 — Add CI pipeline with automated UI tests (combined score 8).**
Justification: These are the highest-impact residual gaps. F01 (no CI, score 4) means all gates are manual and can be skipped. F09 (no automated UI tests, score 4) means AC6 — a stated acceptance criterion — is not verified by any automated check. Together they block progression to Level 3. A CI workflow running typecheck, test, lint, build on every push, plus component tests covering the three UI feedback states (available, unavailable, invalid), would close both gaps. Owner: developer.

**Priority 2: F10 — Add explicit agent prohibitions and review gate to AGENTS.md (score 4).**
Justification: The Rules for Changes section in AGENTS.md has no prohibitions on secrets, real personal data, database connections, or external deployments, and no explicit requirement for a reviewed diff plus passing tests before acceptance. This is the primary guardrail gap — an agent following AGENTS.md literally could introduce a database or deploy without violating any stated rule. A proposal is saved at `practice-10/evidence/AGENTS-proposal.md` but not applied. Owner: developer (requires user approval).

## Human browser check (performed by user on current Bolt preview)

The user performed a browser check on the current Bolt preview. Results reported by the user:

| Input | Expected | Observed | Match |
|-------|----------|----------|-------|
| 11:00-12:00 | Available, interval displayed | "Available", "Room Library Study Room B-12 is free from 11:00 to 12:00." | Yes |
| 10:30-11:30 | Unavailable, overlap reason | "Unavailable", reason: overlap with 10:00-11:00 booking | Yes |
| 12:00-11:30 | Invalid order warning + unavailable | Inline "End time must be later than start time." warning + "Unavailable" with ordering reason | Yes |

**Responsive layout checks (user-reported):**
- Desktop iframe 704px width: `scrollWidth === clientWidth` (no horizontal overflow).
- Narrow iframe 271px width: `scrollWidth === clientWidth` (no horizontal overflow); form collapses to single column.

**NOT run:**
- Exact 390x844 device viewport test.
- Full visual audit (color contrast, font rendering, animation states, all breakpoint transitions).

**Screenshots:** Captured externally by the user after the browser initially timed out. I did not capture screenshots and do not claim to have captured them.

**AC6 partial verification:** The three states checked (available, overlap-unavailable, invalid-order) confirm AC6 for those specific paths. AC6 is not fully verified because the blocked-room state, duration-exceeded state, and range-violation state were not checked in this browser session, and no automated test covers any UI state.

## Task 09: Isolated change procedure

- **Branch:** Work should be done on an isolated branch (e.g., `practice-10-fixes`), not on the baseline.
- **Allowed files:** `src/lib/booking.ts`, `src/lib/booking.test.ts`, `README.md`, `practice-10/**`. AGENTS.md NOT approved for modification.
- **Allowed commands:** `npm ci`, `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`.
- **Prohibited actions:** No CI/dependency updates, no refactoring beyond the minimal guard, no deployment, no UI edits, no AGENTS.md modification, no publishing.
- **Diff/test/build/review evidence:**
  - Originals: `practice-10/evidence/original/booking.ts`, `practice-10/evidence/original/booking.test.ts`
  - Failing-before: `failing-before-typecheck.txt`, `failing-before-test.txt`
  - After: `after-typecheck.txt`, `after-test.txt`, `after-lint.txt`, `after-build.txt`
  - Diffs: `diff-booking.ts.diff`, `diff-booking.test.ts.diff`, `diff-README.md.diff`
  - AGENTS proposal: `AGENTS-proposal.md`
  - Node version: `node-version.txt` (v22.23.1)
  - npm ci dry-run: `npm-ci-dry-run.txt` (exit 0)
- **Human merge/deploy gates:** A human must review the diffs, confirm the checks pass, and approve before any merge or deploy. No automated merge or deploy was performed. Not published.

## Audit readiness

**Level 2 (repeatable, human-supervised).**

Justification: The four checks (typecheck, test, lint, build) exist as npm scripts, are documented in AGENTS.md and README.md, pass consistently, and were run in the correct order with real output captured both before (failing) and after (passing). Level 2 does not require automation — human-supervised repeatability is satisfied. The human browser check provides partial AC6 verification.

**Gaps to Level 3 (isolated automated gates):**
1. No CI pipeline (F01, score 4) — primary blocker.
2. No automated UI/component tests (F09, score 4) — AC6 not automated.
3. `vite.config.ts` not covered by `npm run typecheck` (F06, score 2).
4. No explicit agent prohibitions or review gate in AGENTS.md (F10, score 4).
5. No isolated execution environment for gates.

## Conditional release

**Release condition:** Approved for fictional supervised demo use only.

**Conditions met:**
- All four gates pass (typecheck exit 0, 30 tests pass, lint exit 0, build exit 0).
- Nonfinite input bug fixed with regression tests demonstrating failing-before and passing-after.
- README created with accurate setup and scope.
- Human browser check confirms three UI states and responsive layout at two widths.

**Residual gaps owned by developer:**
- F01: No CI — gates are manual.
- F06: `vite.config.ts` not typechecked by any script.
- F09: No automated UI tests — AC6 not fully automated.
- F10: AGENTS.md lacks explicit prohibitions on secrets/database/deployment and a review gate (proposal saved, not applied).

**NOT approved:**
- No production deployment.
- No public release.
- No real user data.
- No database or backend connection.

## Remaining uncertainties

- **Model/version:** Unknown; not verified in this environment.
- **Clean-install reproducibility:** `npm ci --dry-run` succeeded but a full clean install was not performed. Noted in README.
- **F05 (independent fixtures):** Whether this is drift risk or beneficial oracle pattern is unresolved. No action taken.
- **AC6 full verification:** Only 3 of 6+ UI states were browser-checked. Blocked-room, duration-exceeded, and range-violation states were not checked this session. No automated test covers any UI state.
- **390x844 device viewport:** Not tested. Full visual audit (contrast, fonts, animations, all breakpoints) not run.
- **AGENTS.md proposal:** Not applied. Test-count update and new prohibitions await user approval.
- **`vite.config.ts` typechecking:** F06 remains unmitigated; no `typecheck:node` script was added.
- **Dependency security:** `node_modules` not scanned for vulnerabilities.
