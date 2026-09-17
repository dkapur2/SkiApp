# Hourly adapter staging acceptance — September 16, 2026

This record closes [PR #12](https://github.com/dkapur2/SkiApp/pull/12), the internal Open-Meteo hourly adapter and opt-in evaluation runner for the unchanged `freeze-thaw/0.1.0` model. The owner authorized its review, in-scope fixes, staging merge and bounded non-commercial evaluation. Production promotion was not authorized and did not occur. This documentation follows delivery on a separate branch; it does not add runtime work to the release.

## Verified release and deployment

| Item | Evidence |
|---|---|
| Starting staging baseline | `fb9d8fc231ddbbfae37ab9c65a7ce35892789735` |
| Starting staging deployment | Railway `e90c3c3f-eead-4b3d-ac77-9c844e3eeb9b`, SUCCESS at that baseline |
| Original PR head | `546ef9b9e9792a46646caa0b74bb3b1fdd858186`, base `staging`, clean working tree |
| Reviewed final PR head | `3144ea0ba45332ab59d395cd62356e3f901f884d` |
| Pre-merge checks | [PR CI 35142566710](https://github.com/dkapur2/SkiApp/actions/runs/35142566710) and [push CI 35142560271](https://github.com/dkapur2/SkiApp/actions/runs/35142560271): backend/mobile SUCCESS |
| Merge | PR #12 MERGED into staging at **`4c487b3fada5112a9ba53ad89b7a4b19662e0c3d`**, September 16, 19:55:29 UTC |
| Post-merge checks | [CI 35143472485](https://github.com/dkapur2/SkiApp/actions/runs/35143472485): all jobs completed successfully at the exact merge SHA |
| Backend job | [104953497777](https://github.com/dkapur2/SkiApp/actions/runs/35143472485/job/104953497777), SUCCESS |
| Mobile job | [104953497434](https://github.com/dkapur2/SkiApp/actions/runs/35143472485/job/104953497434), SUCCESS |
| Railway staging | **`4a1ac899-964e-41eb-b529-5559d4ed60e4`**, SUCCESS, commit **`4c487b3fada5112a9ba53ad89b7a4b19662e0c3d`** |
| Acceptance URL | <https://skiapp-staging.up.railway.app> |
| Unchanged main / production | `7538a6af8c6a389542e07829a3b8e2f88a6b5d68`; Railway **`df5cfac0-0507-4bf1-86f5-d503d93552cf`**, SUCCESS at that exact SHA |

Railway's deployment ID, status and `meta.commitHash` were checked together after CI completion. A successful older deployment was not accepted as evidence for this release. Local `staging` was fast-forwarded safely to the verified remote merge with a clean working tree. Production was neither deployed nor reconfigured. The current successful production deployment above remains its recovery reference; no rollback was performed.

## Review and concrete fix

The complete adapter, evaluator, CLI, synthetic fixtures and tests were reviewed, including the implementation rather than CI alone:

- UTC seconds-to-milliseconds conversion, exact hourly endpoints, DST/midnight and fetch-hour boundaries, unique aligned arrays, requested one-hour margins and the model's 73-endpoint/72-interval window.
- Explicit Celsius/mm/GMT declarations, instantaneous temperature and preceding-hour `rain + showers`; exclusion of the interval before the window and conservative rain-at-cold-onset semantics.
- Explicit target elevation and matching response elevation; retained grid centers; no second lapse adjustment or inferred precipitation phase. Null components stay null and known zeros stay zero.
- Request/fetch/evaluation ordering, nullable model-run provenance, stale/missing-input abstention, no inference from `generationtime_ms` or valid times.
- Explicit live opt-in, one fixed-provider request with a 15-second/1 MiB bound, no retry/redirect/credential lookup or startup execution; unavailable/rejected results on failure without invented weather or provider error-body disclosure.
- Offline replay at the recorded evaluation clock, with bounded reads and deterministic output. Imports, checks and synthetic tests do not fetch provider data.

**Finding fixed in `3144ea0`:** a valid provider capture near the 1 MiB limit could produce a formatted evaluation report larger than the old 1 MiB replay-reader limit. The successful report then failed to replay. A new regression reproduced that failure. The CLI now uses a separate shared 4 MiB report/replay bound, including its trailing newline, while retaining the 1 MiB provider bound. A second regression covers the exact serialized-size boundary and rejects output that could not be read back. Both regressions are network-free.

No model rules, public API/client behavior, route/startup integration, numeric score, operations inference, dependencies, Expo versions, persistent caching or provider configuration changed. The reviewed PR contains nine files: internal adapter/evaluator/CLI, tests/fixtures and documentation. The final diff was checked for secrets, generated output, manifests/lockfiles and unrelated features; none were added.

## Checks and dependency review

Clean installs and `npm run check` passed on **Node 20.20.2** before merge:

- Backend: lint, strict TypeScript, **65 network-free tests**, production build.
- Mobile: lint, strict TypeScript, **11 tests**, Android/iOS/web export. Expo remains **57.0.19 / SDK 57**. Staging export used an explicit staging API URL with dotenv disabled; a separate `--clear` web export was used for browser acceptance.
- Refreshed backend `npm audit --omit=dev`: **0 findings**.
- Refreshed mobile production and full audits: **13 moderate, 0 high, 0 critical**. Existing [decode-uri-component](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) and [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq) chains through Expo Router/configuration tooling remain unresolved. Incompatible Expo/Router downgrade suggestions were reviewed and not applied; no forced fixes or dependency changes were made.

Earlier dated results in project status remain historical. These audits are a September 16 snapshot, not a claim that the remaining findings are resolved.

## Staging regression acceptance

API acceptance completed at **20:16:16 UTC**; rendered web and Expo checks completed at **20:20:28–29 UTC**, against the verified deployment above.

| Check | Result |
|---|---|
| `/health` | 200, JSON `{ "status": "ok" }` |
| `/resorts/conditions` | 200, **158 resorts with 158 unique IDs** |
| Killington forecast | 200, existing top-level response shape, 12 hourly and 16 daily entries; base/mid/peak elevation data present |
| Metadata | `source: open-meteo`, valid `fetched_at: 2026-09-16T19:59:43.243Z`, `model_run_at: null` |
| Null and zero | Live response retained null model-run and operations data and **304 numeric zeros**; synthetic adapter/API/frontend regressions separately cover missing weather and provider-failure behavior. Live smoke did not manufacture a provider outage or missing-weather response. |
| Missing recommendation body / malformed JSON | Both HTTP 400. Malformed JSON retains the existing Express HTML error representation; no claim of a JSON 400 is made. |
| Unknown resort / unmatched API paths | `/resorts/not-a-resort/conditions`, `/resorts/not-an-api-route`, `/recommend/not-an-api-route`: JSON 404 with `detail`, not frontend HTML |
| Static routing | `/`, `/index.html`, `/saved/mountains`: 200 HTML with identical static frontend |
| Staging preview CORS | Local clean Expo export at `http://127.0.0.1:8765` allowed by staging |
| Rendered web | Search/load Killington; base/mid/peak controls displayed API-matching highs **73.8/68.3/62.9°F**; visible Open-Meteo and CC BY 4.0 links, server fetch timestamp matching the API, model run “Not provided,” operations “Unavailable”; zero page errors |
| Rendered clean Expo export | **Today → Killington → Resort Detail → Base/Mid/Peak**; displayed API-matching temperatures **74/68/63°F**; visible linked attribution/freshness and unavailable operations; API requests used staging; zero page errors |

The first browser harness attempted search before the catalog request completed and timed out. Read-only page/network diagnosis confirmed successful catalog and resort responses. The harness was corrected to await catalog readiness; the affected rendered web/Expo checks passed. No application code was changed to satisfy the harness. Native exports compiled, but this browser exercise is not signed-device acceptance or a complete accessibility audit.

## Evaluation and retained evidence

After staging acceptance passed, a one-time **nine-request** evaluation covered Killington, Sugarloaf and Whiteface Mountain at catalog base/mid/peak elevations. See the [readable evaluation report and snapshot checksums](../analysis/evaluation-2026-09-16.md). All captures contained complete inputs and replayed identically; no configured signals or abstentions occurred. The samples did not reach the freezing threshold and contain no independent surface observations, so they establish no accuracy or skiing-condition claim.

Raw snapshots, the manifest, report, smoke scripts, JSON results, screenshots, check logs and audit JSON remain outside version control under `.codex-log/evaluations/2026-09-16-pr12/` in the operator's checkout. The repository's existing ignore rule covers that directory. The committed report records each capture's SHA-256 and provenance; raw provider captures and generated Expo exports are not regression fixtures or committed artifacts. Retaining these manual captures for replay does not introduce application caching or scheduled collection.

There is no remaining staging delivery blocker. Surface-risk validation, unresolved mobile audit findings, native/signing gates and commercial entitlement remain separate requirements. The free Open-Meteo endpoint is authorized only for non-commercial evaluation/prototyping. Commercial launch still requires owner-established entitlement/usage budget and separately authorized server-side endpoint/key configuration. No subscription, credentials, optional operations provider, DNS, portfolio or leftover domain/CORS association was changed.
