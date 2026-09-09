# Weather attribution and freshness acceptance

Reviewed against official provider documentation on September 8, 2026.

## Web behavior

The resort page displays Sources & freshness beside the forecast. Open-Meteo metadata produces a provider link, a CC BY 4.0 licence link, and a disclosure of SkiTheEast's elevation adjustments and unit conversions. Missing metadata does not invent a provider or timestamp.

- Weather server fetch uses only `weather_metadata.fetched_at`.
- Provider model run uses only `weather_metadata.model_run_at`; missing or invalid values display “Not provided.”
- Operations use `ski_conditions.fetched_at` separately, when available.
- Timestamps display in UTC. Missing, invalid, or timezone-free fetch timestamps make freshness unavailable. A fetch time more than one minute ahead of the device is flagged as a clock discrepancy.
- Fetches older than 30 minutes are marked stale, matching the existing backend TTL and mobile stale threshold. The label updates every minute and when tab visibility changes, without changing the timestamp or requesting provider data.
- Unavailable forecast measurements remain “—”; measured zeros remain numeric zero. Request failures replace the forecast with an error instead of retaining a misleading previous success.

No API response, provider, cache, or health-check changes are required. `/health` remains provider-free.

For browser acceptance of the clean Expo export, the API allows the exact origin `http://127.0.0.1:8765` only when Railway's built-in `RAILWAY_ENVIRONMENT_NAME` is `staging`. Production and other origins retain the existing CORS policy. This grants browser access to the existing public API and does not add credentials or change authentication.

## Provider requirements and unresolved commercial use

[Open-Meteo's licence](https://open-meteo.com/en/licence) requires credit next to displayed weather data, a licence link, and disclosure of modifications. The web panel includes these elements. The data licence permits commercial redistribution with attribution; this does not grant commercial access to the free hosted API.

[Open-Meteo's terms](https://open-meteo.com/en/terms) restrict the free API to non-commercial use and impose request limits. Advertising, subscriptions, and use in a commercial product are listed as commercial uses. [Paid API plans](https://open-meteo.com/en/pricing) provide commercial access through the customer endpoint and a server-side API key.

**Development decision (September 8–9, 2026):** the owner authorizes the existing free `api.open-meteo.com` endpoint for non-commercial evaluation/prototyping. Keep the current provider and endpoint; no purchase or credential change is authorized. The foundation promotion was separately authorized and completed through PR #9. The production acceptance target is `https://skiapp-production-a4ad.up.railway.app`; `dkapur.com` is not a SkiTheEast endpoint. This does not authorize a commercial launch or production promotion of the experiment.

**Remaining launch requirements:** paid entitlement and the applicable usage budget remain unverified. Before any commercial launch, the owner must establish the appropriate entitlement and separately authorize server-side customer endpoint/key configuration and retesting. Adding attribution alone does not resolve this requirement. See [current project status](../project-status.md).

The optional operations adapter identifies itself as `ski-api`. Its RapidAPI subscription and redistribution/display permissions have not been verified; confirm those before commercially publishing operations data. Weather attribution does not cover this separate provider.

## Verification

`backend/test/frontend.test.ts` executes the actual inline web script against network-free fixtures and inspects generated render output after resort selection. It covers provider/licence links, distinct timestamps, missing and invalid metadata, clock discrepancy, stale transitions, unknown versus zero measurements, and provider errors. Browser acceptance additionally verifies visible UI and working elevation controls against deployed staging.

Run backend and mobile `npm run check` on Node 20, review both production audits, and verify the resulting staging merge SHA in CI and Railway. Check health, 158 unique resorts, a forecast and metadata, invalid requests, JSON API 404s, root/index/nested routing, resort loading, visible attribution/freshness, and the clean staging-configured Expo Today → Resort Detail → Base/Mid/Peak flow before considering a separate production promotion.

Build the clean export with `EXPO_NO_DOTENV=1 EXPO_PUBLIC_API_BASE_URL=https://skiapp-staging.up.railway.app npx expo export --platform all --clear --output-dir /tmp/skitheeast-staging-export`. Serve that directory bound to `127.0.0.1` on port `8765`, and open `http://127.0.0.1:8765` (not `localhost`, which is a distinct origin). Provider keys never enter the export. Verify actual navigation and elevation changes; a successful export alone is insufficient.
