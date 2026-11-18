# Task 06 — Verification review

This is a new ChatGPT review of the recovered checkout. The original Antigravity review report and reviewer prompt were not found in the project. The submission brief lists CRIT-01, CORR-01, CORR-02, CORR-03, MAINT-01, SEC-01, PERF-01, UI-01, TEST-01 and COMP-01. Comments in the recovered source identify some of these IDs. These references are not a substitute for the original report.

## New review brief

Review the recovered Practice 11 implementation against AC1–AC5. Compare it with Bolt's committed version. Inspect the running browser client, the deterministic checker, and the Edge Function separately. Check request and response contracts, timeout, fallback and stale responses. Classify each claim based on code and available test evidence. Keep the checker and its booking rules unchanged.

## Findings

| ID | Severity | Evidence and verification | Classification | Minimal fix and resolution |
|---|---|---|---|---|
| NEW-01 | High | `supabase/functions/explain-availability/index.ts:25–49`, before repair. Invoke the original POST handler with null or with an overlong room label and invalid times. Observed 500 and 200 respectively. See edge-before.txt. | Confirmed | Require an object, bounded fields, valid times and coherent duration before generating. Ten local handler tests pass. |
| NEW-02 | High | `src/lib/mockExplanation.ts:128–145`, working copy before repair accepted a successful HTTP response with the correct status plus an unsupported projector claim. See client-before.txt. | Confirmed | For this deterministic mock, check the source marker and approved wording derived from the submitted checked facts. Otherwise show fallback. Added Vitest regression passes. |
| NEW-03 | High | `git show 5bb8dff:src/App.tsx` shows an unconditional update after await. Recovered `src/App.tsx:52–76, 120–123, 175–178, 197–200` uses a request ID. Editing inputs invalidates it. | Confirmed by source comparison | Retain the recovered request ID check and clear old explanation on edit. |
| NEW-04 | Medium | `src/lib/explanationService.ts:98` explicitly allows 24:00, and explanation test T17 covers it. The original invalid expression was not recovered. The local HTTP test covers 24:00 and rejects 24:15. | Confirmed current behavior. Historical failure plausible / unverified. | Retain client support and add the server boundary check. |
| NEW-05 | Medium | The submission brief reports a wire mismatch. Both files at 5bb8dff use legacy field names. Recovered client sends both naming forms and current server also accepts structured requests. | Plausible / Unverified as a historical defect | Keep both request shapes and check behavior with handler tests. The exact failing historical payload was not recovered. |
| NEW-06 | Low | Claim that the Edge Function or mock could modify a booking. `src/lib/booking.ts` is pure, `src/App.tsx` renders checked facts separately, and the handler returns text. No booking write path was observed. | Unsupported | No code change required. |
| NEW-07 | Low | `src/lib/explanation.test.ts:224–235` is a state-level check. It cannot on its own prove the actual React behavior under network timing. | Confirmed evidence gap | Exercise a delayed response in a browser and record the result where available. |

## Recovered repairs

The source directly shows comments for wire compatibility (CRIT-01), 24:00 (CORR-01), stale response guard (CORR-02), negated overlap wording (CORR-03), newline and tab normalization (SEC-01), and the timeout remaining active during response parsing (PERF-01). The screen copy identifies mock and fallback results. The underlying Antigravity descriptions, original line references and classifications could not be recovered. No descriptions are assigned to the remaining historical IDs.

Original and current stale-response handling, from the Git baseline for the feature and the recovered working copy:

```ts
// Bolt merge 5bb8dff
const outcome = await fetchMockExplanation(facts);
setExplanation(outcome);

// Recovered Antigravity code
const outcome = await fetchMockExplanation(facts);
if (currentReqId === activeRequestIdRef.current) {
  setExplanation(outcome);
}
```
