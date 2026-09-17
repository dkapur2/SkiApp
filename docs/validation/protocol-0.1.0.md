# Freeze–thaw validation protocol / 0.1.0

Protocol identifier: `freeze-thaw-validation/0.1.0`.

Status: **proposed, not yet executed or validated**. Owner input on September 16: resort or research-partner observations are available for a potential pilot. No partner identity, dataset, permission terms or observation has been supplied here. Availability is not a grant of access. Confirm the details below before collecting or using data. Do not scrape restricted sources or contact a partner without authorization.

This protocol studies experimental weather-derived signals from `freeze-thaw/0.1.0`, with `open-meteo-hourly/0.1.0` and `freeze-thaw-evaluation/0.1.0`. It does not verify skiability, safety, resort operations or a numeric condition score. Model thresholds stay frozen for each registered evaluation; changing them requires a new model version and new held-out cases.

## The next milestone

Agree with one permissioned resort/research partner on a small winter pilot: two identified sites, preferably at different elevations, observed over four to six weeks and extended if qualifying weather does not occur. Start with observations the partner can already provide lawfully: timestamped field logs/photos, independent station measurements and documented site metadata. Avoid requiring new equipment for the first pilot. If only one site or retrospective logs are available, report that restriction and study feasibility/label consistency; do not claim prospective forecast skill.

Before starting, record the partner/data owner, permission reference, permitted internal use, attribution, sharing restrictions, retention/deletion date, observer availability and who can export the data. Use anonymized observer codes and local restricted storage outside Git. Ask the partner to supply/export data through an approved channel. Do not place personal names, credentials, restricted imagery or raw partner data in repository fixtures or this viewer's source tree.

**Required owner decisions:** partner and permission contact; which sites and elevations; what data and UTC/timezone precision exist; whether original photos/logs can be retained and independently reviewed; who can observe transitions; pilot dates; case split and proposed criteria below. A permissioned source may still be unsuitable as independent ground truth if its reports are generated from the same weather model.

## Observation record: independent evidence first

Use [`observation-template-0.1.0.json`](observation-template-0.1.0.json), defined by [`observation-0.1.0.schema.json`](observation-0.1.0.schema.json). The supplied template is a **blank draft**; nulls and “unknown” mean uncollected information, not a real observation, measured zero or absence. Schema conformance alone does not prove provenance, permission or scientific suitability. Complete the operational checks here as well.

One record describes one site and observation interval. Give related records an event ID and separate observation IDs. Capture:

- Start/end UTC, recording time, original clock/timezone conversion, time uncertainty and whether this is a delayed transcription. Keep raw source timestamps. Do not silently resolve ambiguous daylight-saving times.
- Exact location and uncertainty, elevation and measurement/source, aspect, shade/exposure, snow-cover status (present/patchy/absent/unknown), and site code. A catalog midpoint is not a surveyed station.
- Method/source: partner field log, direct observation, instrument or permissioned photo review; observer code, source reference, blind/unblind status, instrument calibration where relevant, and uncertainty/disagreement. An image without adequate lighting or scale may be indeterminate.
- Independent surface evidence: dry/damp/wet/unknown, free water, soft/loose/crust/hard ice/mixed/unknown, and whether a **new** crust/ice transition is supported, absent, indeterminate or not assessed. Preserve onset as an earliest/latest UTC interval when observations bracket it. Never invent an exact onset between visits.
- Independently measured air/surface temperatures and precipitation amount, accumulation interval and phase, when available. Record method, source and uncertainty. Leave them null when missing; never copy model values into these fields.
- Grooming, snowmaking, traffic or operations only as independently supplied observations/reports, separately attributed. Unknown is an allowed and expected state. These are potential confounders, not inferred model features.

Do not label “no event” because a report is missing, a lift is closed or weather was cold. “No transition observed” requires adequate repeated inspection across the predefined window. Unknown snow cover, gaps, competing operations, contradictory observers and uncertain timestamps may make surface comparison unscorable. Retain and count these cases with reasons.

## Forecast capture and leakage prevention

1. Register sites, target windows, decision time, observation cadence, signal-to-outcome mapping, exclusions, split and analysis criteria **before looking at results**. Assign complete weather episodes to development or held-out sets before review. Nearby elevation sites in the same storm are correlated, not independent events.
2. At the real decision time, explicitly run the existing bounded runner only within the authorized provider budget. Record actual successful fetch, evaluation clock, version and SHA-256. Preserve raw report bytes in controlled storage with a contemporaneous acquisition log before the event. No schedule or automatic collector is introduced here.
3. Do not replace a pre-event forecast with a later forecast, reconstruct “past forecasts” from today's lookback, alter `asOfMs`, or use hindsight-filled data. A model-run timestamp may be absent; record that limitation. A hash alone proves neither acquisition time nor authenticity. Require a trustworthy acquisition log or partner receipt as well.
4. For prospective scoring, the saved report must have been available before the predefined event/window and its future evidence must cover that window. Lookback model patterns are eligible only for retrospective descriptive comparison, in a separate result set. A saved report downloaded after the event is also retrospective, even if its envelope asserts an earlier time.
5. Keep independent observation labeling blinded to signals where practical. Freeze the observation record before joining it to the forecast using [`case-review-template-0.1.0.json`](case-review-template-0.1.0.json). Corrections need a reason and audit trail; never overwrite originals. A second reviewer should resolve ambiguous labels without seeing model outputs, or retain “indeterminate.”

The local viewer verifies replay consistency and helps inspect evidence; it cannot certify collection time, validate access rights, label real surfaces or compute study accuracy. It makes no weather request and contains no observation upload/storage workflow.

## Case coverage and comparison

Include thaw/refreeze, rain followed by freezing, sustained-cold context, warm/cold non-events, dry cold, uncertain/absent snow, inversions and operations-confounded intervals where feasible. Cases must be selected on the registered schedule or independent observation criteria, not only after a signal appears. Include negative prediction periods and missed observed events. Do not duplicate one weather episode across development and held-out sets.

For the small pilot, propose holding out the last third of complete weather episodes, with the split frozen before their forecasts/labels are inspected. If fewer than six independent episodes occur, report feasibility only and extend collection by agreement. A later external resort/season holdout is required before any broader claim. Record the limitations of convenience sampling and missing sites.

Freeze an initial comparison rule before use: `thaw_then_freezing` and `rain_then_freezing` are candidate signals for **newly observed crust/ice after documented wetness or thaw on a susceptible surface**. Their two-hour cold evidence is a temperature-model interval, not an observed surface-onset time. Compare its interval against independently bracketed transition timing, initially within a proposed ±3-hour matching tolerance. Use one-to-one matching per site/episode and retain unmatched detections. Do not tune this tolerance on the held-out set. `sustained_cold` is context only; compare it to independent air temperature separately and never count it as an ice prediction or a surface true positive.

Report separately by signal kind, site/elevation and prospective/retrospective status:

- Eligible, complete, observed, indeterminate, excluded and unscorable case counts with reasons; permission and provenance failures must be visible.
- Detected observed transitions, **missed observed transitions**, **false detections** in adequately observed non-event windows, and correctly quiet windows. Count each case/episode once per registered comparison. A quiet model with absent observations is not a correct negative.
- Timing intervals/errors. When onset is only bracketed, retain the error range and interval overlap; do not pretend the midpoint is exact. For genuinely timed events, report signed and absolute error distributions, not only a mean.
- Precision/recall and false-detection rates with explicit denominators and uncertainty intervals; account for episode clustering. Sparse pilot samples are not a stable accuracy estimate.
- Abstention rate and reasons (missing/stale data, normalization rejection), stratified by whether adequate observations existed. Keep abstentions separate from negatives. Also report end-to-end coverage and how many observed events occurred while the model abstained; never hide missing predictions to inflate accuracy.

For eligible, adequately observed and non-abstained cases, use precision = TP/(TP+FP), recall = TP/(TP+FN), and false-detection rate = FP/(FP+TN), with one registered decision window per case. A zero denominator is **undefined**, not zero. Report abstention = abstained scheduled cases/all eligible scheduled cases, and separately report unserved observed events during abstention and end-to-end detection = detected observed events/all adequately observed events (including abstention). Publish exclusions and unobserved windows beside these denominators; do not count them as TN. These are study metrics, not per-resort condition scores.

## Proposed gates — decisions to ratify, not validated thresholds

These are **study-design proposals**, not alterations to model rules, promises of performance or launch criteria:

| Gate | Proposal | If unmet |
|---|---|---|
| Integrity | 100% of scored cases have explicit permission, independent evidence, immutable original files, recorded versions, and acceptable acquisition-time proof. Zero known leakage across the split. | Exclude with reasons; stop scoring if systematic. |
| Pilot feasibility | At least 20 scorable transition windows and 20 deliberately observed non-event windows across two sites and at least six independent episodes; ≥90% of planned visits have usable time/location/method records. | Report feasibility only; extend or revise the protocol before another pilot. These counts are not an accuracy guarantee. |
| Label quality | Two blinded reviewers agree on ≥80% of a prespecified double-reviewed subset (at least 10 cases); disagreements remain visible. | Improve the rubric/source quality before interpreting model skill. |
| Exploratory performance target | On a frozen holdout, propose recall ≥0.80, false-detection rate ≤0.20, median absolute onset error ≤3 hours where exact onset exists, and abstention ≤0.20. Publish counts, coverage and uncertainty even if targets are met. | Diagnose data limitations and rule hypotheses separately. Do not tune and re-score the same holdout. |
| Next research step | A partner accepts the observation rubric and the evidence supports a larger, independently held-out study. | No user-facing integration or accuracy claim from this pilot alone. |

Ratify or revise these targets with the partner before collecting/scoring; suitable sample size depends on event prevalence, uncertainty and acceptable missed/false detection costs. Meeting small-sample point estimates is insufficient for public presentation. Predefine stronger sample-size/uncertainty requirements before a larger study.

## Optional instrumented study

After separate access/budget approval, use surveyed base/mid/peak sites across multiple resorts/aspects: calibrated shielded near-2 m air temperature, separate snow/surface temperature, and independent precipitation gauges/phase observations, ideally at ≤15-minute cadence through complete transitions. Record sensor siting, calibration, snow-cover presence, uncertainty, maintenance and outages. Combine instrumentation with blinded surface visits/photos before/during/after transitions; air temperature alone is not surface ground truth. Retain independent resort operations records as confounders. Hold out entire resorts/episodes and repeat across seasons before generalizing. No equipment purchase or collection is authorized or performed by this implementation.

## Current evidence and release boundary

The [nine September captures](../analysis/evaluation-2026-09-16.md) had no qualifying events and no independent observations. They are pipeline/replay checks, excluded from physical-accuracy scoring. Synthetic viewer examples are invented inputs, excluded from every observational denominator. The [local viewer guide](../analysis/review-viewer.md) describes launch, privacy and screenshots. Open-Meteo free usage remains non-commercial evaluation only; commercial entitlement and separately authorized server-side configuration remain launch requirements.
