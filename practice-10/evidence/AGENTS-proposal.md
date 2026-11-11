# AGENTS.md Proposed Patch — NOT APPLIED (awaiting approval)

## Current text (line 13)
```
- `src/lib/booking.test.ts` - unit tests for the rule. Cases T01-T19 must stay.
```

## Proposed replacement
```
- `src/lib/booking.test.ts` - unit tests for the rule. Cases T01-T19 must stay; T20-T30 are additional and must also stay.
```

## Proposed new section: Rules for changes (additions)

Add to the existing "Rules for changes" section:

```
- Do not introduce secrets, API keys, real personal data, database connections, or external service deployments.
- Do not add a database, login, or data persistence. The prototype stays static and client-only.
- Every code change must include a reviewed diff plus passing typecheck, tests, and build before acceptance.
```

## Rationale
- T01-T19 floor does not forbid additions, but the count should reflect reality (now T01-T30).
- Explicit prohibitions prevent scope creep into backend/auth/deployment, matching the project's stated scope.
- The review gate makes the acceptance process explicit: no change is accepted without a visible diff and green checks.

## Status
Draft only. Not applied to AGENTS.md. Saved for review.
