# Local freeze–thaw review viewer

This internal tool reads existing `freeze-thaw-evaluation/0.1.0` reports. It is isolated from the Express API, static web client, Expo app and production startup. No dependencies were added. TypeScript, native browser controls/SVG and Node's local HTTP server reuse the existing stack and unchanged model/normalizer.

## Launch

From the repository, select **Node 20**, then:

```sh
cd backend
node --version # must show v20.x for the verified toolchain
npm ci
npm run review:viewer
```

Open **<http://127.0.0.1:4317>**. Use this exact loopback address; the server deliberately rejects other Host headers. If navigation from another website gets a 403, paste the loopback URL directly into the address bar. Stop with Ctrl+C. If the port is occupied, stop the earlier viewer rather than exposing it on another interface. `npm run build:review` compiles browser modules into ignored `backend/dist/review/`; the opt-in server uses `tsx`. The production `build` and `start` commands, Dockerfile, model thresholds and provider/API behavior are unchanged. `npm run check` now also lints, typechecks and builds the internal viewer.

## What to review

1. Start with an empty library. Use **Choose evaluation JSON files** to load saved runner reports explicitly. Import is limited to 4 MiB per file, 30 reports in memory and 32 MiB per batch. Raw snapshot envelopes, manifests, unknown versions, malformed JSON and inconsistent reports produce useful errors; valid files in a mixed batch can still load. Duplicate bytes are skipped.
2. Choose a resort/location, elevation and evaluation-window/report. Exact catalog request coordinates identify resorts; unmatched coordinates stay coordinate-labeled. Grid coordinates are retained separately and never guessed into a resort name. Elevation labels are catalog matches, not surveyed observation sites.
3. Review temperature endpoints and **preceding-hour** liquid intervals, with a UTC evaluation boundary. The lookback is also weather-model data, never observations. The first endpoint's preceding interval is outside the analysis window. Missing hours/values create gaps; known zeros remain zeros. The interval straddling the exact evaluation time is labeled explicitly. Pattern period labels retain the model's rounded-hour boundary, explained alongside the exact-time display.
4. Use Tab and native select controls, arrow keys on **Inspect an hour**, or the expandable 73-row data table. Every value is available as text; neither color nor hover is required. The table can scroll with the keyboard on small screens. Synthetic-example buttons work with Enter/Space. Focus remains on the hour control as values change; there are visible focus outlines, labeled controls and live error/status regions. Chrome desktop and a 390px viewport were exercised; no complete screen-reader certification is claimed.
5. Inspect patterns, evidence intervals and explanatory reasons. Rejected normalization has no timeline or analysis. Incomplete or stale input shows abstention. No pattern **never means good, safe, ice-free, open or skiable**. There is no condition score.
6. Inspect source, fetch/model-run time, request/grid elevation, capture fingerprint, versions and limitations. Model-run absence remains **Not provided**. Historical replay uses its saved clock; opening a file now does not make it a fresh forecast.

Reports are parsed with byte/depth/complexity bounds and replayed in memory using the saved snapshot. The imported structure, versions, normalized input, status, signals, reasons, limitations and attribution must match that deterministic replay. Object key order is irrelevant. This checks consistency, **not input authenticity, trustworthy acquisition time, observation truth or permission**. Files with other model/adapter versions need their matching viewer/runner; they are not silently migrated.

## Provider captures versus synthetic examples

- The four explicit synthetic examples demonstrate thaw/refreeze, rain/freezing, sustained-cold context and insufficient data. They use invented weather inputs/timestamps at a synthetic site. They are not real weather events, provider captures or observations; they are excluded from physical-validation denominators.
- Other imported files default to **unverified origin**. The operator may label them provider captures or synthetic before import. Operator labels are assertions, not authentication. Merely naming a file after a resort does not establish its origin.
- The nine [September 16 captures](evaluation-2026-09-16.md) are identified by their recorded SHA-256 fingerprints, calculated from the selected file bytes in the browser. They display **Provider capture · September pipeline check**, with “no qualifying events” and an explicit no-accuracy claim. Matching proves membership in the retained artifact set, not provider authenticity. Editing/reserializing a file changes its fingerprint and removes that designation.
- On the current operator checkout, select JSON files in `.codex-log/evaluations/2026-09-16-pr12/snapshots/`. They remain outside Git and are never loaded automatically. Do not select `manifest.json` as a report. No new live weather calls are required.

## Local privacy boundary

File contents are read with the browser [File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications), retained only in page memory and cleared on reload/Clear reports. No file upload, analytics, storage API, service worker, scheduled task, cache or weather-fetch operation is implemented. Browser [CSP `connect-src 'none'`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src) blocks fetch/XHR/WebSocket connections. Required script/style requests go only to the loopback server; external attribution links navigate only when deliberately clicked.

The server binds exclusively to `127.0.0.1:4317`, enforces the matching Host and same-origin request context, and serves an explicit allowlist of viewer assets and blank validation documents. It rejects uploads, arbitrary filesystem paths, traversal/query variants and cross-origin/Host-rebinding probes. Responses use `no-store`, `nosniff`, same-origin resource/opener policy and framing restrictions. It never lists or serves the retained snapshot directory. Do not reverse-proxy, port-forward, deploy or expose this server publicly. The viewer is not a security sandbox against an untrusted local machine/browser extension.

## Validation kit and checks

The sidebar links a [permissioned-partner pilot protocol](../validation/protocol-0.1.0.md), [blank independent-observation template](../validation/observation-template-0.1.0.json) and [JSON Schema](../validation/observation-0.1.0.schema.json). A [separate case-review template](../validation/case-review-template-0.1.0.json) joins frozen observations to pre-event forecasts after blinded labeling. Draft nulls are not observations. Completed-record schema requirements, manual chronology/independence checks, event/non-event coverage, whole-episode holdouts and proposed study criteria are explicit. No partner data or observations have been collected by this task.

Verification on Node 20.20.2: clean backend `npm run check` passed **75 tests** plus lint/types/production and viewer builds; mobile `npm run check` passed **11 tests** plus lint/types and Android/iOS/web export. Refreshed backend production audit: **0**; mobile production/full: **13 moderate, 0 high/critical**, existing decode-uri-component/uuid chains unchanged. No dependency or lockfile changes were made. The observation JSON Schema was checked with the existing development toolchain: blank drafts and known zero pass; incomplete complete records, negative rain and timezone-free clocks fail.

Ten new network-free regressions cover schema/replay tampering and bounds, four scenario outcomes, UTC/interval/null semantics, missing hours, rejected normalization, provenance labels, catalog mapping, HTML injection, finite chart scaling, and loopback privacy controls. The server test uses local HTTP only, with no external service. Browser acceptance imports all nine retained files, selects resorts/elevations/reports, exercises all four examples and keyboard inspection, checks error/duplicate handling, verifies reload clears memory, and records that every request was a GET for a named loopback asset. Screenshots and test logs remain outside Git under `.codex-log/review-viewer/`.

Provider attribution and licence remain visible. Free-endpoint use is for non-commercial evaluation/prototyping only. Commercial entitlement and separately authorized server-side endpoint/key configuration remain launch requirements. No public API/UI integration, production promotion, provider switch, Expo upgrade, caching, PostGIS, radar or ticket-pricing work is included.
