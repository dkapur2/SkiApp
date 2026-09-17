# SkiTheEast internal hourly evaluation — September 16, 2026

Delivery: [PR #12 staging acceptance](../deployment/hourly-staging-acceptance-2026-09-16.md). Code: staging merge `4c487b3fada5112a9ba53ad89b7a4b19662e0c3d`, model `freeze-thaw/0.1.0`. Captures: 2026-09-16T20:21:14.906Z through 2026-09-16T20:22:03.164Z.

**These are weather-model estimates, including lookback hours. No trail/surface observations were collected, and these samples cannot establish accuracy, skiability or safety.**

## Bounded method

9 one-location requests, maximum nine, three variables and 75 hourly endpoints each; at least five seconds between requests, no retries, no schedule or automatic refresh. Failed transport/HTTP capture stops the remainder. Each request has the runner’s 15-second/1 MiB response bounds. Saved reports use the 4 MiB replay bound.

Official [terms](https://open-meteo.com/en/terms) list free non-commercial limits of 600/minute, 5,000/hour, 10,000/day and 300,000/month. Under [request accounting](https://open-meteo.com/en/pricing), each of these three-variable, roughly three-day single-location requests is one call: nine units maximum. Existing application traffic shares limits; its aggregate provider usage is not available here. This small manual budget does not establish remaining account quota. No 429 is ignored or retried.

Catalog coordinates (latitude, longitude): Killington **43.68, −72.82**; Sugarloaf **45.03, −70.31**; Whiteface Mountain **44.37, −73.90**.

Coordinates and elevations come directly from the existing resort catalog. Mid elevation is its computed midpoint, not an independently surveyed station. Each resort uses the same catalog coordinate at three requested elevations; these are provider downscaling experiments, not observations at three physical stations.

## Completeness and output

| Resort | Elevation | Target m | Temperature endpoints | Liquid intervals | Model °C min–max | Model liquid mm / 72h | Signals | Result | Replay |
|---|---|---:|---:|---:|---|---:|---|---|---|
| Killington (VT) | base | 355 | 73/73 | 72/72 | 5.0–24.4 | 0.0 | No configured pattern | analyzed | Identical |
| Killington (VT) | mid | 822 | 73/73 | 72/72 | 2.7–20.6 | 0.0 | No configured pattern | analyzed | Identical |
| Killington (VT) | peak | 1289 | 73/73 | 72/72 | -0.4–17.6 | 0.0 | No configured pattern | analyzed | Identical |
| Sugarloaf (ME) | base | 432 | 73/73 | 72/72 | 6.7–23.4 | 0.0 | No configured pattern | analyzed | Identical |
| Sugarloaf (ME) | mid | 861 | 73/73 | 72/72 | 4.2–19.1 | 0.0 | No configured pattern | analyzed | Identical |
| Sugarloaf (ME) | peak | 1291 | 73/73 | 72/72 | 1.4–16.3 | 0.0 | No configured pattern | analyzed | Identical |
| Whiteface Mountain (NY) | base | 372 | 73/73 | 72/72 | 6.7–24.7 | 0.0 | No configured pattern | analyzed | Identical |
| Whiteface Mountain (NY) | mid | 854 | 73/73 | 72/72 | 4.4–20.0 | 0.0 | No configured pattern | analyzed | Identical |
| Whiteface Mountain (NY) | peak | 1337 | 73/73 | 72/72 | 1.4–16.2 | 0.0 | No configured pattern | analyzed | Identical |

A missing or rejected capture is an abstention, never zero weather or “no risk.” Counts describe usable endpoints/intervals after normalization. Liquid is provider rain + showers over preceding hours; the interval before the window is excluded. A zero amount remains numeric zero. Min/max and totals summarize modeled values, not measured precipitation or temperatures.

## Snapshot provenance

| Capture | Fetch time UTC | Grid center | Response elevation m | Model run | SHA-256 |
|---|---|---|---:|---|---|
| `killington-base.json` | 2026-09-16T20:21:15.941Z | 43.679585, -72.805984 | 355 | Not provided | `5558a0e2e1da5feee0c499df4bf0caed787ea982888c3c74ef0b0641f376c979` |
| `killington-mid.json` | 2026-09-16T20:21:21.937Z | 43.660786, -72.85163 | 822 | Not provided | `5540a08cd003db9a1e9c5899f68c11520eebd8f8e9c4dfda042296433e5d2873` |
| `killington-peak.json` | 2026-09-16T20:21:28.175Z | 43.660786, -72.85163 | 1289 | Not provided | `1c1b1b3746b5096b8f53a93e9f554d7f9e3d9cd619525d65bbee9e98204f9095` |
| `sugarloaf-base.json` | 2026-09-16T20:21:34.256Z | 45.06679, -70.32926 | 432 | Not provided | `e76925f3d23349e8159cfe29ee724231657c07ee0c152a67af364ecba9cfe42a` |
| `sugarloaf-mid.json` | 2026-09-16T20:21:40.070Z | 45.03335, -70.304016 | 861 | Not provided | `f0b4a8d0ed6f741bf73a7f243f8e8ef9bfc197b2e4183864117ffc5a65fa40ff` |
| `sugarloaf-peak.json` | 2026-09-16T20:21:45.799Z | 45.03335, -70.304016 | 1291 | Not provided | `b526c01f85adabe47350d3515b8d705f6d4a7c8d693a95e597649fde03398c57` |
| `whiteface-mountain-base.json` | 2026-09-16T20:21:51.551Z | 44.35734, -73.86724 | 372 | Not provided | `da7263599420bb94974dbd650c20665370d2defa5d341a1d8c764548e8981448` |
| `whiteface-mountain-mid.json` | 2026-09-16T20:21:57.316Z | 44.3901, -73.89403 | 854 | Not provided | `fd4601bd2b416f9246981973f7ebe0a47451c237643008020ab6e984d2651854` |
| `whiteface-mountain-peak.json` | 2026-09-16T20:22:03.081Z | 44.36414, -73.90354 | 1337 | Not provided | `03de8a84b79e8692810eaf0ad5df845a402fa8e8c610d2d901f4871a44f2057f` |

Every capture selected the same UTC window: **September 14 20:00 → September 17 20:00**, anchored at **September 16 20:00**. Each response had 75 raw endpoints; normalization retained 73 endpoints and 72 liquid intervals. Each analysis returned reason `no_pattern`.

## Signals, abstentions and limitations

All nine captures were analyzed; there were zero capture failures, zero abstentions and zero configured signals. All 648 required liquid intervals were known numeric zeros. The coldest modeled temperature was −0.4°C (Killington peak), above the model’s −1°C freezing threshold; no positive freeze-transition case was sampled. All nine model-run timestamps were absent. Missing-data and stale-input abstention behavior was exercised by synthetic network-free tests, not by these complete live captures.

Returned grid centers varied with requested elevation at all three resorts. Temperature differences therefore confound grid selection and elevation downscaling; these are not controlled lapse-rate comparisons.

Nine closely spaced captures are not nine independent weather events. Base/mid/peak share model/grid information. Air-temperature downscaling and declared response elevation do not validate local inversions, precipitation phase, aspect, shade, snow cover or surface temperature. Missing model-run timestamps limit model-age assessment. A current fetch does not establish fresh model initialization. These September samples cannot validate winter snowpack/refreeze behavior.

## Independent observations needed next

- Agree on observation sites and a rubric before examining model signals: geolocated base/mid/peak sites with surveyed elevation, slope/aspect, exposure/shade and verified snow-cover presence. Do not assume the catalog coordinate describes every elevation station.
- Record calibrated, shielded air temperature near 2 m at ≤15-minute cadence through complete thaw/rain/freezing cycles; log UTC time, sensor uncertainty, placement and maintenance. Measure near-surface/snow temperature separately.
- Obtain independently measured precipitation amount, phase and event timing at each elevation, with gauge limitations and uncertainty. Do not derive those observations from the same Open-Meteo inputs.
- Use consented observer reports/photos of wetness, softness, crust/ice and depth, with method, location and uncertain/mixed labels, before/during/after transitions and morning/midday/afternoon. Record disagreement. No snow or unknown snow cover must be explicit.
- Record grooming, snowmaking, opening/closing and traffic only when independently supplied by a resort/observer, separately from model inputs; no inferred operations.
- Save forecasts before the decision/event, preserve original fetch/run provenance, and blind observers to signals where practical. Include multiple events, non-events, inversions, rain and thaw cases across all three resorts; hold out complete resorts/events. Predefine minimum sample coverage and acceptance criteria, then examine timing error, precision/recall, abstention and false reassurance. These nine captures supply no accuracy estimate.

## Replay and attribution

Raw snapshots are deliberately outside version control in `.codex-log/evaluations/2026-09-16-pr12/snapshots/` in the operator’s SkiApp checkout. They are manual evaluation captures, not regression fixtures or application cache entries. The sibling `manifest.json` has SHA-256 `e82aa60c5869480d6cdf141410551e236648afbe8d78d50f8535aa2a1699c400`. Each filename above is relative to that snapshot directory. The sibling `evaluation-report.md` contains clickable local snapshot links.

From the repository backend directory on Node 20 after building, replay any retained JSON using `node dist/cli/evaluateFreezeThaw.js --input /absolute/path/to/snapshot.json`. Each file retains the original provider response, capture metadata, normalized input and analysis. The manifest records checksums and code SHA. Do not replace its original evaluation clock with today’s time to claim historical forecast skill.

Weather data: [Open-Meteo](https://open-meteo.com/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Modifications: UTC window selection, rain/showers addition and experimental analysis by SkiTheEast. Free endpoint use is non-commercial evaluation only; commercial entitlement and separately authorized server-side endpoint/key configuration remain launch requirements.
