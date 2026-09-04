# SkiTheEast mobile

Expo SDK 57 implementation of the approved Today → Resort Detail → Base/Mid/Peak forecast slice.

## Setup

Use a supported Node LTS release, then:

```bash
npm ci
cp .env.example .env.local
npm run ios
```

`EXPO_PUBLIC_API_BASE_URL` is a public client setting, not a secret. The checked-in example points to the Railway staging API. Production builds must override it with the production API URL. Weather-provider and operations-provider credentials remain on the backend.

For repeatable local visual comparisons, development builds may set `EXPO_PUBLIC_VISUAL_THEME` to `light` or `dark`. The override is ignored in production builds, which follow the operating-system appearance.

## Verification

```bash
npm run check
```

The check runs the Expo ESLint configuration, strict TypeScript checks, network-free tests, and production exports for iOS, Android, and web.

## Scope

This milestone deliberately excludes ranking, numeric scores, AI advice, travel estimates, crowds, maps, radar, alerts, saved resorts, pass data, and inferred surface quality. Missing values are displayed as unavailable and never interpreted as zero.

Weather freshness comes from the backend's successful provider-fetch timestamp, not the phone's request time. The API also supplies an explicit source and a nullable provider model-run timestamp; the UI labels an unavailable model run without inventing one.
