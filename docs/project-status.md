# Project status — September 9, 2026

## Completed foundation and acceptance

- Express 5.2.1 migration: [PR #7](https://github.com/dkapur2/SkiApp/pull/7), merged into staging at `279c08c3175eae244ac3c5a925d8ad3f546ff1bb`. Existing API shapes, null/zero semantics, provider isolation and static routing preserved.
- Web attribution/freshness: [PR #8](https://github.com/dkapur2/SkiApp/pull/8), merged into staging at `dac1bd8d591ac587a85602522739bdb54a8cbc63`. Visible provider/licence links, server fetch time, nullable model-run time, separate operations freshness and honest unavailable/stale states are implemented and tested.
- Staging acceptance passed at that exact SHA: health; 158 unique resorts; representative forecast/metadata; invalid requests; JSON API 404s; root/index/nested static routes; rendered resort loading and attribution/freshness; clean Expo web Today → Resort Detail → Base/Mid/Peak. Native exports compiled; signed device acceptance is still separate.
- [Staging CI](https://github.com/dkapur2/SkiApp/actions/runs/34269356771) passed backend/mobile. Railway staging deployment `c9ae2277-713a-4be5-a502-1c17482eacd6` reported SUCCESS at the accepted SHA.
- [Foundation promotion PR #9](https://github.com/dkapur2/SkiApp/pull/9) merged into main at `dd2fd3ca47208bf4bd8cf1cd4d8ea091d4f1f3d8` on September 8. [Post-merge CI](https://github.com/dkapur2/SkiApp/actions/runs/34288937288) passed backend/mobile. Railway production deployment `2062a64d-5404-476e-91c5-a328e4e894d4` reported SUCCESS at that exact SHA, with production API and rendered web acceptance passing.
- On September 9 the owner confirmed `https://skiapp-production-a4ad.up.railway.app` as the production acceptance target for non-commercial evaluation and authorized PR #10's review/merge into staging only. `dkapur.com` is the owner's Vercel portfolio, not a SkiTheEast endpoint; its leftover Railway association and backend CORS entries are separate cleanup work. Do not change DNS or the portfolio.
- Previous successful production deployment/rollback target: `2734b1af-81b8-4b30-b787-bf8b7d3e0a53` at `37350d748fbd5b0f99dff773decd862502f3ba2d`. [Evidence PR #11](https://github.com/dkapur2/SkiApp/pull/11) separately records release/review outcomes. No experiment production promotion is authorized.

## Current development

The [first freeze–thaw experiment](analysis/experimental-freeze-thaw.md) is an isolated TypeScript model (`freeze-thaw/0.1.0`) with 20 synthetic scenario tests and documentation. It is not connected to the provider, API, clients, recommendations or deployment startup. Outputs are experimental weather-derived surface-risk signals, never verified trail conditions or numeric condition scores. Physical validation and a separately reviewed integration are required before presenting outputs to users.

Expo stays SDK 57. PostGIS, persistent caching, maps, radar and unrelated UI work remain outside this experiment. For any later mobile release, clear Metro before changing the API URL and verify the exported bundles; cached exports can retain the staging URL. Signing, accessibility and device gates remain separate.

## Dependency security status

The September 8 foundation promotion review found zero backend production vulnerabilities and 13 mobile moderate findings, with no high/critical findings (full mobile audit also reviewed). The remaining chains are `decode-uri-component` through Expo Router and `uuid` through Expo configuration tooling. Incompatible Expo/Router downgrade suggestions were not applied.

**Current experiment review, September 8:** Node 20.20.2 backend checks passed (47 tests, including 20 new scenario tests); mobile checks passed (11 tests plus Android/iOS/web export). Refreshed `npm audit --omit=dev` reports zero backend findings and 13 mobile moderate findings, zero high/critical. The full mobile audit reports the same 13. Reviewed advisories: [URL-decoding denial of service](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) and [UUID buffer bounds](https://github.com/advisories/GHSA-w5hq-g745-h8pq), propagated through the existing dependency chains above. No application/dependency integration is added by the model; no manifest/lockfile changes or forced fixes were made. These are audit results, not a claim that the remaining findings are resolved.

The [September 3 audit](security/dependency-audit-2026-09-03.md) is historical: its Express 4 findings predate the completed migration. Refresh audits for every new release; this status is not a claim that earlier audit results remain current indefinitely.

September 9 staging review refresh: Node 20.20.2 backend/mobile checks passed again (47/11 tests and builds). Backend production audit remains zero; mobile production/full audits remain 13 moderate, zero high/critical. Review clarified precipitation-interval wording and updated stale promotion status; the experimental algorithm and dependencies are unchanged.

## Provider decision and launch requirements

The owner authorizes the existing Open-Meteo free endpoint for **non-commercial evaluation/prototyping only**. Keep `api.open-meteo.com`; do not purchase subscriptions, switch providers or change credentials for this experiment. Respect [free endpoint terms and usage limits](https://open-meteo.com/en/terms) and preserve [linked attribution/licence and modification disclosure](https://open-meteo.com/en/licence).

Commercial launch remains gated on owner-established entitlement and usage budget, then separately authorized server-side customer endpoint/API-key configuration and retesting. Development authorization is not commercial launch clearance. Optional operations-provider subscription and redistribution rights also require review before enabling/publishing those data; no operations observations are inferred by this experiment. See [provider requirements](deployment/weather-attribution-and-freshness.md).
