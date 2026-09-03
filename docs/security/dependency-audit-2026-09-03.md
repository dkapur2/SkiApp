# Dependency audit triage — 2026-09-03

This review was performed from the Step 1 foundation close-out branch with the checked-in lockfiles.

## Commands reviewed

Run from both `backend/` and `mobile/`:

```bash
npm audit
npm audit --omit=dev
npm audit fix --dry-run
npm outdated
```

No high or critical findings were reported. A forced audit fix was not run.

## Backend

- Result: three moderate findings through Express 4.22.2, `body-parser`, and `qs`.
- The advisories require `qs` 6.16.0 or newer, while Express 4.22.2 constrains it to `~6.15.1`.
- npm offers Express 5.2.1 as the fix. That is a major runtime migration and is not a compatible Step 1 change.
- The service does not enable URL-encoded body parsing and its current routes do not consume nested query objects. This reduces exposure but does not remove the need to track the advisories.
- `npm audit fix --dry-run` proposed zero non-breaking package changes.

Decision: retain Express 4 for this close-out and handle Express 5 as a separately tested migration, or adopt a future compatible Express 4 patch if one is released. Do not force an out-of-range `qs` override.

## Mobile

- Result: thirteen moderate findings in Expo Router and Expo build/configuration tooling.
- The URL-decoding advisory is inherited through `expo-router` → `query-string` → `decode-uri-component`.
- The UUID advisory is inherited through Expo configuration tooling → `xcode` → `uuid`; the affected UUID functions are not called by SkiTheEast application code.
- npm proposes incompatible Expo or Expo Router downgrades. Expo SDK 57's compatibility check and Expo Doctor both pass with the current versions.
- `npm audit fix --dry-run` did not identify a compatible version change that removes an advisory.

Decision: keep the SDK 57 dependency set intact and take vendor-compatible patches when Expo publishes them. Do not force dependency versions outside Expo's supported graph.

## Production gate

Before promoting to production, rerun both audits, review any changed severity or exploitability, and record the result in the promotion evidence. A new high or critical runtime finding blocks promotion unless it is demonstrably unreachable and that exception is documented.
