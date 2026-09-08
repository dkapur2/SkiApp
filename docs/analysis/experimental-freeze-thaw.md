# Experimental freeze–thaw analysis v0.1.0

`backend/src/analysis/freezeThaw.ts` exports `analyzeFreezeThaw` and explicit input/result types. Version: `freeze-thaw/0.1.0`. This is a deterministic weather-pattern experiment, not a validated snowpack model, trail report, recommendation or condition score. It is not imported by any route, provider or client. No request, API response, cache or UI changes are included.

## Provider inputs and availability

Official documentation reviewed September 8, 2026:

- The [Forecast API](https://open-meteo.com/en/docs) supplies hourly model estimates and archived forecasts through `past_hours`/`past_days`, plus `forecast_hours`. These are not station or trail observations; some model values are interpolated. `temperature_2m` is instantaneous air temperature. `rain` and `showers` are preceding-hour precipitation amounts. Use Celsius, millimetres, `timeformat=unixtime` and GMT. `elevation` controls provider downscaling; default terrain elevation is not necessarily resort elevation. Availability varies by model.
- [Historical Weather](https://open-meteo.com/en/docs/historical-weather-api) uses reanalysis/model estimates informed by observations, not direct trail measurements. ERA5 products have a five-day delay; they are not the input for this near-real-time experiment.
- [Historical Forecast](https://open-meteo.com/en/docs/historical-forecast-api) is a separate archive for future retrospective evaluation. It is not used or configured here. Revised/archived weather must not be mistaken for the forecast available to a user at an earlier decision time.

The initial contract needs 48 hours of lookback and 24 hours forward. These horizons are **our experimental choices**, intended to capture a recent transition and the following day, not provider-validated physical limits. Older ice can persist beyond this window.

| Normalized input | Intended origin | Purpose and missing behavior |
| --- | --- | --- |
| `validAtMs` | Provider UTC epoch seconds × 1000 | Exact hourly instants; no timezone-free strings or local DST arithmetic |
| `temperatureC` | `temperature_2m` at explicitly requested elevation | Air-temperature sequence; null/non-finite suppresses analysis |
| `liquidPrecipitationMm` | Provider `rain + showers`, both non-null, same elevation/interval | Model-estimated liquid input; a missing component stays null, never zero |
| `source.fetchedAtMs` | Actual successful server fetch timestamp | Required provenance/freshness; not a model initialization time |
| `source.modelRunAtMs` | Reliably supplied initialization metadata, otherwise null | Never infer from hourly valid time, fetch time or generation duration |
| `elevation` | Explicit target plus source elevations for both measurements | Require equality; no silent fallback or repeated lapse adjustment |
| `asOfMs` | Injected evaluation clock | Reproducible window and stale-input decisions |

A bounded read of the **existing** free `/v1/forecast` endpoint at `43.6045,-72.8201`, elevation 1000 m, completed at `2026-09-08T20:34:52Z`. `past_hours=49&forecast_hours=25`, the three hourly variables above, Celsius/mm, GMT and Unix time returned 74 hourly endpoints, September 6 19:00Z through September 9 20:00Z. All three arrays had 74 non-null values, hourly spacing was 3600 seconds, and response elevation was 1000 m. No model-run metadata was supplied. This single sample establishes availability there at that time; it does not establish geographic completeness, forecast accuracy, snow cover or usable ski conditions. The live response is not a test fixture and tests never request provider data.

Future normalization can deliberately overfetch with those hour counts, then select the exact required window and check every timestamp, unit and value. Do not assume returned array length or timezone offset, or replace missing components with zero. This PR adds no fetching/normalization implementation.

## Existing adapter assessment

`backend/src/services/openMeteo.ts` currently requests 16 forecast days, with no past hours, and exposes only `next_12_hours` plus daily aggregates. Neither the 12-hour slice nor daily highs/lows preserve the required ordered history. `currentHourIndex` uses local-time strings and the response offset; the experimental contract instead requires absolute UTC instants.

The adapter applies a fixed 6.5°C/km temperature lapse adjustment from the provider response elevation to base/mid/peak, including apparent temperature. It falls back to resort mid elevation if response elevation is absent. The other weather arrays are shared across elevations. For this experiment, a missing elevation must remain unavailable; air temperature is the input, not apparent temperature. Provider downscaling followed by our fixed lapse assumption needs independent elevation validation, especially for inversions. Simply relabeling shared precipitation as a target-elevation estimate would not satisfy the new contract.

`openMeteoSemantics.ts` derives rain/snow from total precipitation using a linear 32–34°F phase split and a fixed 10:1 snow/water ratio. Daily phase uses the mean of daily high/low. Although the adapter requests provider rain/snow, those values are replaced by that derivation; showers are not requested. These are existing heuristics, not measured precipitation phase or snowpack. The experimental input uses provider liquid components and does **not** reuse that split, daily phase, fixed snow ratio or derived snowfall. A future adapter must validate provider phase at each requested elevation; v0.1.0 does not independently model mixed/freezing rain or refashion phase based on temperature.

The existing imperial adapter uses conversion helpers for length fields. The new input path should check response unit declarations directly and use explicit SI units. It does not need snow depth, freezing level, visibility or their conversions. No existing adapter behavior is changed by this PR.

## Deterministic rules

Let `T = floor(asOfMs / 1 hour) × 1 hour`. Require 73 temperature endpoints from `T−48h` through `T+24h`, inclusive, and 72 liquid-precipitation intervals ending after `T−48h`. Rain at the first endpoint is ignored because its interval precedes the window. The endpoint at `T` is lookback; later endpoints include forecast. This is classification of valid time, not proof of observation.

Rules are fixed in `FREEZE_THAW_RULES`; changing thresholds, missing-data policy or temporal semantics requires a new version. No machine clock, randomness, network, persistent state or interpolation is used.

| Signal | Rule | Interpretation |
| --- | --- | --- |
| `thaw_then_freezing` | At least two consecutive samples ≥ +1°C, then at least two consecutive samples ≤ −1°C; at most 24 hours from latest qualifying warm-run end to cold-run start | Conditional refreeze potential if susceptible wet/snow surface exists |
| `rain_then_freezing` | A preceding-hour liquid amount ≥ 0.5 mm ends strictly before a cold-run start, at most 24 hours earlier; cold run has at least two samples ≤ −1°C | Possible freezing of residual water, not observed wetness/ice |
| `sustained_cold` | At least 12 consecutive samples ≤ −1°C | Context only; no evidence of fresh snow, good grip or absence of old ice |

These thresholds are uncalibrated hypotheses. Two hourly samples span one elapsed hour; twelve span eleven. They do not prove temperature stayed beyond a threshold between samples. The ±1°C band avoids treating tiny changes around zero as transitions, but is not an uncertainty estimate. Rain threshold is per-hour, not accumulated drizzle. At most one of each transition type is returned per uninterrupted cold run; multiple cycles and cold context may coexist. Warm and cold runs terminate at neutral samples. The latest qualifying warm run and latest qualifying rain interval are used. There is no water-retention/energy-balance calculation.

Each signal includes explanatory text, UTC evidence intervals, and `lookback_model` or `includes_forecast`. Rain evidence includes the actual preceding hour; cold transition evidence uses its first two samples. Completed lookback events are not carried forward as claims about the current surface. A sustained-cold range can span both lookback and forecast. Signals are ordered by cold-run time, then thaw, rain, cold context. There is no numeric severity, probability, condition score, grooming/snowmaking inference or operations output.

## Insufficient data and limits

Missing hours, duplicates, invalid/non-hourly times, null/non-finite required values, negative rain, missing/mixed elevation, missing/future fetch timestamps or fetch age over 30 minutes produce `insufficient_data`, reason codes and **no signals**. Valid zero is retained. Model-run time may be null; a supplied invalid or post-fetch initialization time is rejected. Outside-window values are ignored, but malformed timestamps are rejected because they cannot be placed. Reordering valid input does not change results or mutate input. Callers must satisfy the typed schema; a later network boundary must validate raw JSON before constructing it.

The 30-minute fetch limit is an experimental input policy, not proof of model recency; a recently fetched response can still use older model runs. All-or-nothing coverage is deliberately conservative and can suppress otherwise supported temperature signals when rain is unavailable. Changing to partial analysis requires a separately specified contract.

`analyzed` with no signals means only that no configured pattern was found. Surface state remains unknown, even during sustained cold. No snow-cover confirmation, surface temperature, snow-water content, radiation, aspect, shading, canopy, wind redistribution, traffic, grooming, snowmaking or operations data enter the model. Summer rain/freezing could also trigger a conditional weather pattern; this must never establish skiing availability. Rain during/after an existing cold-run onset is outside the rain-then-freezing rule. A renewed thaw can alter the surface after a detected event. These omissions constrain interpretation and validation.

## Practical validation plan and next integration

1. In a separate PR, add a server-only normalization path behind the existing provider service for the explicit history/horizon and target elevation, preserving public API shapes. Verify units, rain/showers null handling, timestamps, response elevation, freshness and provider failures with network-free adapter fixtures. Do not label existing derived client rain as provider rain. Keep outputs internal/opt-in; request-budget review precedes any additional background fetching.
2. Collect a consented, time-stamped evaluation set across at least three eastern resorts, multiple elevations/aspects, and several warm/cold cycles. Record independent thermometer readings and actual surface observations at morning/midday/afternoon with location/elevation, method and observer. Record grooming/snowmaking and operations only when a resort/observer actually supplies them, separately from model inputs. Obtain permission for any third-party report data.
3. Pair each record with the forecast snapshot actually available before the decision time, its fetch/run provenance, requested elevation and version. Evaluate lookback-model error separately from future-event error. Avoid hindsight leakage from later model revisions; archives/reanalysis are comparison estimates, not ground truth. Start with manually retained evaluation artifacts, not a persistent production cache.
4. Predefine the observation rubric with observers (wet/soft snow, crust/firm refrozen surface, uncertain/mixed), retain disagreements and unknowns, and blind observers to model output where practical. Compare transition detection precision/recall, timing error and abstention rate by elevation, horizon, rain versus thaw, and data completeness. Track false reassurance explicitly even though the module never declares safe conditions.
5. Hold out complete resorts/events from tuning. Stress threshold ±0.5°C and timing ±1 hour, elevation mismatch/inversions, slow drizzle, new snow obscuring crust, and missing values. If signals are unstable, poorly supported or misleading, revise/version or leave them unavailable. Agree on sample size and acceptance criteria before reviewing held-out outcomes; no accuracy claim is supported yet.
6. Only after evidence review, separately design an experimental presentation with visible weather provenance, unknown states, reasons and limitations. Do not publish condition scores or inferred operations. Staging integration must wait until PR #9 is resolved so its promotion candidate is not changed.

## Checks and provider authorization

`cd backend && npm run check` runs the synthetic scenarios plus existing API/frontend regressions on Node 20. Fixtures in `backend/test/fixtures/freezeThaw.ts` are synthetic, not fabricated observations. Tests cover thaw/refreeze, rain timing, sustained cold, thresholds/expiry, multiple cycles, missing/null/zero, provenance, DST/UTC, and independent elevations. Mobile `npm run check` also remains required; Expo stays SDK 57.

The owner authorizes the free endpoint for non-commercial evaluation/prototyping only. Commercial entitlement, usage budget and separately approved server customer endpoint/key configuration remain launch requirements. No subscription, provider switch, credential change or deployment is included. See [current status](../project-status.md) and [provider terms/attribution](../deployment/weather-attribution-and-freshness.md).
