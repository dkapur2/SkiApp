# Step 2 data capability matrix

The prototype includes future-state concepts so that the information architecture is not constrained by today's static client. This matrix prevents those concepts from being mistaken for existing product behavior.

| Product signal | Available now | Source today | Needed before shipping the concept |
| --- | --- | --- | --- |
| Resort name, state, coordinates, and three elevations | Yes | TypeScript resort catalog | Validate coordinates and migration source during Step 3 |
| Next 12 hours at base, mid, and peak | Yes | Open-Meteo adapter | Source and server-fetch metadata are exposed; add provider model-run time only when reliably available |
| Daily forecast at base, mid, and peak | Yes | Open-Meteo adapter | Define reliable decision horizon; visually deemphasize long-range uncertainty |
| Snowfall, rain, temperature, wind, gust, visibility, cloud, and freezing level | Yes | Open-Meteo adapter | Null/zero semantics and imperial length conversions are regression-tested; continue provider validation |
| Lift, run, snow report, and resort status | Optional and incomplete | Ski API adapter when configured | Coverage audit, licensing review, independent freshness, and unknown-state UI |
| AI recommendation | Optional | Anthropic adapter when configured | Keep behind deterministic facts; add structured, testable explanation inputs |
| Nearby resorts and radius filters | No | — | Step 3 PostGIS geography point and `ST_DWithin` query |
| Region and map-viewport results | No | — | Step 3 GeoJSON endpoint and spatial bounding-box query |
| Travel time | No | — | Routing provider, commercial terms, caching, origin consent, and fallback to straight-line distance |
| User location | No | — | Explicit permission flow and manual-origin alternative |
| Condition score | No | — | Versioned deterministic model, validation data, uncertainty, tests, and explanation contract |
| Surface interpretation | No | — | Deterministic freeze–thaw/rain/snow logic validated against observations |
| Crowds | No | — | Credible source or user-derived model; do not infer without evidence |
| Radar and nowcast | No | — | Step 5 licensed provider or NOAA MRMS pipeline, map tiles, attribution, and cost controls |
| Favorites | No persistent support | — | Local-first storage in Expo, followed by account sync only if justified |
| Alerts | No | — | Persistent preferences, scheduled evaluation, APNs workflow, deduplication, and quiet notification policy |
| Compare | No | — | Stable summary contracts and spatial/travel context |

## Rules for implementation

- Unknown is not zero.
- Forecast data is not an observation unless explicitly labeled.
- Resort operations and weather must carry separate timestamps.
- The user must be able to understand the main reason for a recommendation without invoking an AI provider.
- A score must not ship until its inputs, weights, uncertainty behavior, and failure modes are documented and tested.
- Location must be opt-in, scoped to its use, and replaceable by a manual origin.
- Radar, weather, maps, and resort-operation providers must retain required attribution in the client.
