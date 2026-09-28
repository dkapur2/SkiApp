# Old Rag in the web hiking menu

The web dropdown has a **Hiking → Old Rag** entry, separate from ski resort state
groups. It shows hourly weather at **Base, Mid and Summit**, plus daily forecasts
switchable between those locations. Expand **Trail forecast locations** to see
coordinates and the selection rationale. Hiking has no ski AI advisor or
operations-provider calls. The mobile ski catalog remains 158 resorts.

## Trail point selection — September 27, 2026

The route is the **Ridge Trail ascent from the main Old Rag parking area**, not
Berry Hollow or the descent along the Saddle Trail. “Mid” means half the net
vertical rise from this trailhead to the summit viewpoint: `base + (summit − base)/2`.
It does not mean half the summit's elevation above sea level, half the trail
length, cumulative climb including descents, or formal topographic prominence
(which is defined relative to a mountain's key saddle).

| View | Latitude, longitude (WGS84) | Terrain elevation | Height above Base |
| --- | --- | --- | --- |
| Base — Ridge Trail start | 38.57162186, −78.29415182 | 284.5 m / approximately 933 ft | 0 ft |
| Mid — Ridge Trail | 38.55877199, −78.30137686 | 640.3 m / approximately 2,101 ft | approximately 1,167 ft |
| Summit — NPS Old Rag Summit marker | 38.55171256, −78.31460513 | 997.2 m / approximately 3,272 ft | approximately 2,338 ft |

These coordinates come from the official public NPS datasets, queried in WGS84:

- [NPS trail centerlines](https://mapservices.nps.gov/arcgis/rest/services/NationalDatasets/NPS_Public_Trails_Geographic/FeatureServer/0): Base is the first vertex of Ridge Trail object **12083** (feature `{88154d25-0e30-4e05-a486-95afb848dad1}`). Mid is zero-based vertex **457** of Ridge Trail object **13631** (feature `{5fae2ee6-3b45-4c2b-959e-4c09478a00ff}`). Both records identify differential GPS mapping and an accuracy class of ≤1 m; this is source metadata, not our field verification. Their edit date is July 31, 2025.
- [NPS summit point](https://mapservices.nps.gov/arcgis/rest/services/NationalDatasets/NPS_Public_POIs_Geographic/FeatureServer/0/query?objectIds=18876&outFields=*&outSR=4326&f=pjson): **Old Rag Summit**, object **18876**, geometry ID `{5d841659-c788-48d1-a05a-62a4ce50abd8}`. This is the mapped summit visitor area, approximately 10 m from the Ridge/Saddle trail junction and 37 m from the former generic mountain coordinate. The summit record's positional accuracy is **unknown**; its edit date is August 27, 2026.
- The [NPS route map](https://www.nps.gov/shen/planyourvisit/upload/OldRag_RoadTrail.pdf) confirms the ascent and summit area and labels Old Rag **3,291 ft**. Our approximately **3,272 ft** is the DEM sample at the mapped visitor point, not a revision to the published mountain height. Point selection and terrain/survey uncertainty can contribute to the difference; we have not independently surveyed the summit.

[USGS EPQS](https://epqs.nationalmap.gov/v1/docs) supplied the following terrain
samples on September 28 UTC (September 27 local time). All three returned raster
**75304**, **1 m resolution**, acquisition date **August 4, 2014**:

- [Base query](https://epqs.nationalmap.gov/v1/json?x=-78.29415182&y=38.57162186&units=Meters&wkid=4326&includeDate=true): **284.501831055 m**.
- [Mid query](https://epqs.nationalmap.gov/v1/json?x=-78.30137686&y=38.55877199&units=Meters&wkid=4326&includeDate=true): **640.254577637 m**.
- [Summit query](https://epqs.nationalmap.gov/v1/json?x=-78.31460513&y=38.55171256&units=Meters&wkid=4326&includeDate=true): **997.218383789 m**.

The exact halfway target from these samples is **640.860107422 m**; the selected
trail vertex is **0.606 m (about 2 ft) below it**. Earlier samples at vertices 450
and 500 bracketed the target at 637.590209961 m and 661.640563965 m. This is close
enough for approximate weather sampling without inventing a point off the trail.
NPS geometry Z values were zero placeholders and were **not** used as elevations.
DEM resolution is not a claim of vertical accuracy; rocks, vegetation, surveying
and data age can cause differences. Coordinates are weather references, not
navigation instructions. Current access information remains linked to
[NPS](https://www.nps.gov/places/old-rag.htm).

## Weather requests and semantics

`GET /hiking/conditions` retains its existing metadata fields and adds
`weather_points` with named coordinates and elevations. The conditions response
structure and the ski resort API remain unchanged.

The hiking service makes one independent Open-Meteo request per point, supplying
that point's **latitude, longitude and elevation in metres**. Open-Meteo's
[documented elevation override](https://open-meteo.com/en/docs) handles statistical
downscaling; the app does **not** then apply a second temperature lapse-rate
adjustment to hiking values. Existing ski forecasting is unchanged. Provider grid
centres can be kilometres from requested coordinates and different trail points
may share model grids. This improves location/elevation targeting, not model
resolution or verified trail-weather accuracy.

- Validate returned elevation, imperial units, numeric-or-null arrays, current
  hourly coverage and matching hourly/daily windows across all three responses.
  Reject partial, inconsistent or failed groups as HTTP 502; never fill a failed
  point with summit data or zero.
- Hourly and daily Base/Mid/Summit temperature, wind, precipitation, depth and
  visibility come from their respective responses. Existing precipitation-phase
  approximations and unit conversions still apply. Cloud/freezing-level fields
  are summit summaries, explicitly labeled in the web view.
- `weather_metadata.fetched_at` is the **oldest completion time** of the three
  successful responses; `model_run_at` remains null when unavailable. Attribution
  identifies Open-Meteo downscaling and app unit conversions. These are weather
  estimates, not observations of trail or rock-surface conditions.
- Use the existing in-memory 30-minute policy for the whole successful group,
  keyed by coordinates/elevations. No separate storage or collection service is
  added. Hiking is excluded from startup resort warming. A cold request normally
  makes three provider calls; existing bounded retries allow at most nine
  attempts. Free endpoint usage is accounted for per location and requested
  variables/time range, not merely HTTP calls.

Existing non-commercial evaluation authorization and commercial launch
requirements still apply. No new provider, credentials, mobile/Expo changes,
experimental analysis integration or production promotion is included.

## Regression acceptance

Network-free tests pin sourced trail points and midpoint arithmetic; distinguish
three point-specific forecasts; verify explicit elevation requests, no second
lapse adjustment, units, time alignment, null/zero handling, fetch provenance,
failed groups and rendered Base/Mid/Summit switching. Browser acceptance should
check health/catalogs, Hiking selection, all three hourly elevations, daily tab
values, coordinates, attribution/freshness, and returning to a ski resort.

Current trail-point refinement checks on Node 20.20.2: backend lint/strict types,
**77 network-free tests** and build passed; mobile lint/types, **11 tests** and
Android/iOS/web exports passed. Production audits remain backend **zero**, mobile
**13 moderate / zero high or critical** in the existing decode-uri-component/uuid
chains, with no dependency changes. Local Chrome acceptance passed at desktop
and 390px widths, including actual point-specific hourly and daily values,
Base/Mid/Summit clicks, the displayed coordinates and a return to ski controls.
Health, separate catalogs, static routes and JSON 404s passed; no page errors.

## Historical summit-only implementation checks — September 27, 2026

- Node 20.20.2 backend check: lint, strict types, 71 network-free tests and build passed.
- Node 20.20.2 mobile check: lint, types, 11 tests and Android/iOS/web exports passed;
  no mobile source, Expo version or dependency changes.
- Production dependency audits: backend zero findings; mobile 13 moderate, zero
  high/critical, in the previously reviewed `decode-uri-component` and `uuid`
  chains. No forced dependency changes were applied.
- Local Chrome acceptance passed with actual provider responses: health, 158
  unique ski resorts, separate Old Rag catalog, JSON 404s, static routes,
  rendered Hiking search/selection, 12 hourly cards, 16 daily rows, linked
  attribution/freshness, return to ski elevation controls, and a 390px web layout.
  Browser assertions reported no page errors. Synthetic null/zero and provider
  failures are covered separately by the network-free regression suite.
