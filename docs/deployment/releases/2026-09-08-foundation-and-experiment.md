# Foundation promotion and experimental staging review — September 8, 2026

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

## Custom-domain discrepancy and phase boundary

Railway lists `dkapur.com` on the production service, but public requests at 23:07 UTC reached Vercel:

- `GET https://dkapur.com/`: 200, `server: Vercel`, rendered title `Dhruv Kapur | Portfolio`; no SkiTheEast catalog request, so the resort-loading smoke timed out.
- `GET https://dkapur.com/health`: Vercel HTML 404 (`x-matched-path: /404`).
- `https://www.dkapur.com/`: 307 redirect to the apex, served by Vercel.
- The local DNS lookup returned `64.29.17.1` and `64.29.17.65` for the apex.

This is evidence of a domain-assignment discrepancy, not evidence that the new Railway image failed. No DNS or Vercel changes were made, and no rollback/redeployment was attempted. The owner was asked whether the verified Railway URL is the intended production acceptance target for evaluation or whether Phase 2 must remain paused for the custom-domain decision. Do not repoint an active portfolio domain without explicit authorization. If a SkiTheEast custom domain is required, choose the intended host, configure its DNS/Railway assignment separately, and repeat domain-specific browser/API acceptance. Reverting application code would not by itself correct this routing discrepancy.

## Phase 2 status

[PR #10](https://github.com/dkapur2/SkiApp/pull/10) remains OPEN at `dd472152401a0d9fab209a2e5a0a3e6087f372a3`, targeting staging. Its initial head/base, mergeability and green backend/mobile CI were verified. The detailed Phase 2 review and merge are paused pending the production acceptance-domain decision above. No experiment code has entered main or the production deployment.

## Audits, rollback and retained requirements

Refreshed backend production audit: zero vulnerabilities. Mobile production and full audits: 13 moderate, zero high/critical. Reviewed remaining advisories: `decode-uri-component` URL-decoding denial of service through Expo Router/query-string, and `uuid` bounds checks through xcode/Expo configuration tooling. npm suggested incompatible Expo 46/Router 5 downgrades; no dependency changes or forced fixes were applied. Earlier September 3 findings remain a historical snapshot rather than a current backend audit.

Rollback target retained: previously successful production deployment `2734b1af-81b8-4b30-b787-bf8b7d3e0a53`, commit `37350d748fbd5b0f99dff773decd862502f3ba2d`. No rollback was authorized or performed.

The existing Open-Meteo free endpoint remains authorized only for non-commercial evaluation/prototyping. Commercial entitlement, usage budget and separately approved server-side customer endpoint/key configuration remain launch requirements. No subscription, provider switch, credentials or optional operations integration was changed.

After the release/review gates are resolved, the next feature is an internal server-only Open-Meteo hourly normalization adapter and evaluation runner: validate UTC/SI units, exact history/horizon, same-elevation rain/showers and temperature, nulls and fetch/run provenance; exercise synthetic fixtures and retained evaluation snapshots without changing public API shapes or publishing condition scores. That work has not started here.
