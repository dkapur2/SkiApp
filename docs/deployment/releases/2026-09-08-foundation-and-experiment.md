# Foundation promotion and experimental staging review — September 8–9, 2026

This evidence is a separate documentation change. It does not add code to either release, authorize a rollback, change DNS, or promote the freeze–thaw experiment to production.

## Phase 1: foundation production promotion

- [PR #9](https://github.com/dkapur2/SkiApp/pull/9), staging → main, merged September 8 at 23:04:09 UTC with the owner's explicit authorization for non-commercial evaluation/prototyping.
- Reviewed head: `dac1bd8d591ac587a85602522739bdb54a8cbc63`.
- Resulting main merge: `dd2fd3ca47208bf4bd8cf1cd4d8ea091d4f1f3d8`. Its Git tree is exactly the reviewed staging candidate's tree.
- Previous main/production: `37350d748fbd5b0f99dff773decd862502f3ba2d`.
- All eight changed files reviewed: Express 5.2.1 and corresponding dependencies/types, compatible API/SPA routing, web attribution/freshness and unavailable handling, exact staging preview CORS, tests and documentation. No mobile files, migrations, credentials, generated output or experimental analysis code were included. Expo remains SDK 57 (locked 57.0.19).
- Refreshed Node 20.20.2 checks: backend lint/strict types, 27 network-free tests and build PASS; mobile lint/strict types, 11 tests and Android/iOS/web export PASS. Previously clean production-configured bundles were re-inspected: Android/iOS/web contain the production API URL and no staging URL. Mobile was not released; signing/device/accessibility gates remain separate.
- [Pre-merge PR CI](https://github.com/dkapur2/SkiApp/actions/runs/34273921062) and [post-merge main CI](https://github.com/dkapur2/SkiApp/actions/runs/34288937288) PASS. Post-merge [backend](https://github.com/dkapur2/SkiApp/actions/runs/34288937288/job/102270881078) and [mobile](https://github.com/dkapur2/SkiApp/actions/runs/34288937288/job/102270880820) both passed from clean Node 20 installs at the exact resulting merge SHA.
- Railway production deployment `2062a64d-5404-476e-91c5-a328e4e894d4`: SUCCESS, sole active deployment, commit `dd2fd3ca47208bf4bd8cf1cd4d8ea091d4f1f3d8`, `/health` configured.

## Production and pre-merge staging acceptance

The foundation candidate remained deployed on staging as `c9ae2277-713a-4be5-a502-1c17482eacd6`, SUCCESS at `dac1bd8d591ac587a85602522739bdb54a8cbc63`. Fresh staging API and rendered browser smoke passed immediately before promotion, supplementing earlier clean Expo web Today → Resort Detail → Base/Mid/Peak acceptance at that same SHA.

Production API smoke at `https://skiapp-production-a4ad.up.railway.app` PASS:

- `/health`: 200 `{status:ok}`; local regression verifies provider-free behavior.
- `/resorts/conditions`: 200, 158 unique resort IDs.
- Killington: 200, existing response shape, 12 hourly and 16 daily entries, base/mid/peak measurements, Open-Meteo source, valid server fetch time and nullable model run. Live response retained null model-run/operations data and 294 numeric zeros. Missing measurement/provider-failure behavior passed network-free fixtures; no live provider outage was induced.
- Missing recommendation body and malformed JSON: 400. Malformed JSON retains the reviewed existing HTML error representation.
- Unknown resort and unmatched API paths: JSON 404.
- `/`, `/index.html`, `/saved/mountains`: 200 with identical static frontend content.
- Exact local Expo preview origin excluded from production CORS; the same origin is allowed only on staging. Production environment identity remains `production`; optional operations key remains absent. Provider credentials were not exposed or changed; client source contains only public backend routing/configuration.

Rendered production browser acceptance on the Railway URL PASS at 23:07:51 UTC: search selected Killington; linked Open-Meteo/CC BY 4.0 attribution and adjustment disclosure were visible; server fetch time `2026-09-08T23:05:45.679Z` matched the response; model run displayed Not provided and operations Unavailable. Base/Mid/Peak controls changed the first daily high to 69.8°F / 64.3°F / 58.9°F, matching the respective response values. Browser API requests stayed on the production backend; no page errors were reported. This exercised rendered behavior, not HTML keyword checks alone.

Bounded logs for the exact production deployment showed successful startup on port 8080 and no unexpected runtime errors. The deliberate malformed-JSON smoke generated one expected SyntaxError. Railway HTTP logs associated successful health/catalog/forecast/static requests and expected invalid-request responses with deployment `2062a64d-5404-476e-91c5-a328e4e894d4`.

## Historical custom-domain discrepancy and resolved phase boundary

Railway lists `dkapur.com` on the production service, but public requests at 23:07 UTC reached Vercel:

- `GET https://dkapur.com/`: 200, `server: Vercel`, rendered title `Dhruv Kapur | Portfolio`; no SkiTheEast catalog request, so the resort-loading smoke timed out.
- `GET https://dkapur.com/health`: Vercel HTML 404 (`x-matched-path: /404`).
- `https://www.dkapur.com/`: 307 redirect to the apex, served by Vercel.
- The local DNS lookup returned `64.29.17.1` and `64.29.17.65` for the apex.

At that time this was evidence of a domain-assignment discrepancy, not a failed Railway image. No DNS or Vercel changes were made, and no rollback/redeployment was attempted. Phase 2 was paused for the owner's production acceptance-target decision. The failed portfolio probes above are retained as historical evidence; reverting application code would not correct that routing discrepancy.

**Resolved September 9:** the owner selected [the Railway production URL](https://skiapp-production-a4ad.up.railway.app) for SkiTheEast non-commercial evaluation. `dkapur.com` is the intended Vercel portfolio and is not a SkiApp acceptance endpoint. Railway production was rechecked before resuming Phase 2: deployment `2062a64d-5404-476e-91c5-a328e4e894d4` remained SUCCESS at `dd2fd3ca47208bf4bd8cf1cd4d8ea091d4f1f3d8`, with `/health` returning 200 `{status:ok}`. The acceptance-target question no longer blocks PR #10.

**Separate cleanup proposal, not performed:** inventory consumers of the obsolete `dkapur.com`/`www.dkapur.com` backend CORS entries, then remove those entries and their corresponding tests/documentation in a focused reviewed change. Separately remove the unused Railway custom-domain association after confirming it is unused. Preserve the portfolio's DNS and Vercel configuration. No DNS, domain configuration or CORS changes belong to this release/review task.

## Phase 2: experimental staging review and acceptance

[PR #10](https://github.com/dkapur2/SkiApp/pull/10), `codex/experimental-freeze-thaw` → `staging`, merged September 9 at 23:46:58 UTC under the owner's authorization. Initial head `dd472152401a0d9fab209a2e5a0a3e6087f372a3` was reviewed in full. Final reviewed head: `f222e237575b3dfbec30ee6659073c626d9506b1`; staging merge: **`fb9d8fc231ddbbfae37ab9c65a7ce35892789735`**.

- Actual implementation review covered deterministic rules, UTC hour boundaries, 48-hour history/24-hour horizon, preceding-hour precipitation intervals, inclusive thresholds, repeated cycles, null versus zero, stale/future/missing provenance, elevation consistency and insufficient-data behavior. No blocking rule defect was found. The test name and analysis documentation now explicitly say rain must end strictly before the first cold sample: an interval ending exactly at that sample is conservatively excluded, even though it describes the preceding hour. No algorithm change was needed. Project/provider documentation now records the completed foundation promotion and owner decision rather than the previous pending-promotion state.
- All nine changed files remained limited to the pure versioned TypeScript module, synthetic fixtures/tests and documentation. No provider fetch, route/client integration, startup execution, numeric condition score or invented surface/operations observation was added. No API, dependencies, mobile/Expo, PostGIS, persistent caching, maps, radar, secrets or generated files changed. Existing runtime routes/services, static frontend, mobile source, Dockerfile and backend dependency manifests are identical to the foundation release.
- Refreshed local Node 20.20.2 checks PASS: backend lint/strict types, **47 network-free tests**, build; mobile lint/strict types, **11 tests**, Android/iOS/web export. [Final-head PR CI](https://github.com/dkapur2/SkiApp/actions/runs/34418139931) and [push CI](https://github.com/dkapur2/SkiApp/actions/runs/34418136693) PASS. [Post-merge staging CI](https://github.com/dkapur2/SkiApp/actions/runs/34418426678) PASS at the exact merge SHA: [backend](https://github.com/dkapur2/SkiApp/actions/runs/34418426678/job/102688363220) and [mobile](https://github.com/dkapur2/SkiApp/actions/runs/34418426678/job/102688363408).
- Railway staging deployment **`e90c3c3f-eead-4b3d-ac77-9c844e3eeb9b`**, **SUCCESS**, commit **`fb9d8fc231ddbbfae37ab9c65a7ce35892789735`**. Production remained on foundation deployment `2062a64d-5404-476e-91c5-a328e4e894d4` throughout this staging acceptance.
- Staging API regression PASS: health 200; 158 unique resorts; Killington forecast and unchanged metadata/response shape; null model-run/operations retained and 228 numeric zeros retained; missing body/malformed JSON 400; unknown resort and unmatched API paths JSON 404; root/index/nested static routes 200 with identical frontend. Provider-failure and missing-measurement behavior is covered by network-free tests, without inducing a live outage.
- Rendered staging web regression PASS at 23:48:56 UTC: Killington loaded; linked Open-Meteo and CC BY attribution, fetch time matching `2026-09-09T23:48:49.290Z`, model run Not provided and operations Unavailable were visible. Base/Mid/Peak first daily highs were 66.8°F / 61.3°F / 55.9°F, matching API values. No page errors or production API requests occurred.
- A new `expo export --platform all --clear` with dotenv disabled and the staging API configured succeeded. Android/iOS/web bundles contained the staging URL and no production URL. Its served web export completed Today → Killington → Resort Detail → Base/Mid/Peak at 23:50:44 UTC, with selected visual state, changing temperatures (64°F / 59°F / 53°F), visible attribution/server freshness/Not provided/Unavailable, and only staging API requests. No page errors occurred. This was rendered interaction, not export success alone; no native binary was released.
- Separate pre-existing mobile accessibility follow-up: the Expo web radio elements omit `aria-checked` despite `accessibilityState` in source. Their visual selection and elevation-dependent content work. The smoke harness initially assumed that ARIA attribute; inspection confirmed the existing markup limitation, and functional assertions were changed to rendered content and selection. This experiment changes no mobile source. Native/device and accessibility release gates remain separate.

This evidence is carried by [documentation PR #11](https://github.com/dkapur2/SkiApp/pull/11), based on foundation `main`, not the experimental staging tree. Its authorized merge contains Markdown only; any resulting production deployment is a documentation-only successor of the foundation release. The PR's merge record and post-merge checks identify that successor SHA. No freeze–thaw experiment is included in this documentation promotion.

## Audits, rollback and retained requirements

Refreshed backend production audit: zero vulnerabilities. Mobile production and full audits: 13 moderate, zero high/critical. Reviewed remaining advisories: `decode-uri-component` URL-decoding denial of service through Expo Router/query-string, and `uuid` bounds checks through xcode/Expo configuration tooling. npm suggested incompatible Expo 46/Router 5 downgrades; no dependency changes or forced fixes were applied. Earlier September 3 findings remain a historical snapshot rather than a current backend audit.

Rollback target retained: previously successful production deployment `2734b1af-81b8-4b30-b787-bf8b7d3e0a53`, commit `37350d748fbd5b0f99dff773decd862502f3ba2d`. No rollback was authorized or performed.

The existing Open-Meteo free endpoint remains authorized only for non-commercial evaluation/prototyping. Commercial entitlement, usage budget and separately approved server-side customer endpoint/key configuration remain launch requirements. No subscription, provider switch, credentials or optional operations integration was changed.

After the release/review gates are resolved, the next feature is an internal server-only Open-Meteo hourly normalization adapter and evaluation runner: validate UTC/SI units, exact history/horizon, same-elevation rain/showers and temperature, nulls and fetch/run provenance; exercise synthetic fixtures and retained evaluation snapshots without changing public API shapes or publishing condition scores. That work has not started here.
