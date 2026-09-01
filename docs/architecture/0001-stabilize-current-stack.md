# ADR 0001: Stabilize the current TypeScript stack before product expansion

- Status: Accepted
- Date: 2026-08-31

## Context

SkiApp currently runs as a static browser client served by a TypeScript/Express API in a Docker container on Railway. Resort definitions live in source code. Weather and recommendation requests depend on external providers, and caching is process-local.

The intended product direction includes a native-feeling App Store client, map and radar layers, PostGIS-backed spatial queries, and persistent caching. Attempting all of those changes before the existing service has repeatable checks would make regressions difficult to isolate.

## Decision

Keep the current deployment architecture for this milestone and first establish:

- one Node 20 quality gate for linting, strict type checking, network-free tests, and the production build;
- a provider-independent health endpoint;
- repository and Codex documentation;
- clean source control without dependencies, generated output, caches, or secrets;
- automated GitHub Actions verification.

Railway remains the deployment target during the product rebuild. The static frontend remains available while the mobile experience is designed and implemented.

## Consequences

- Product behavior remains substantially unchanged.
- CI can detect regressions without provider credentials or internet access.
- Railway health checks no longer depend on third-party weather availability.
- Future Expo and PostGIS work begins from a smaller, reproducible repository.
- In-memory cache warming and hard-coded resort data remain known limitations for later decisions.

## Explicitly deferred

- Expo or React Native scaffolding
- PostgreSQL/PostGIS and GeoJSON endpoints
- Radar-provider integration
- Persistent or distributed caching
- Hosting migration
