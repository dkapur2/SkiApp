# Step 2: mobile product definition

- Status: Approved direction
- Product phase: Information architecture, wireframes, design system, and interactive prototype
- Runtime impact: None
- Prototype data: Illustrative, not live

## Product proposition

SkiTheEast helps an East Coast skier decide **where to ski and when conditions will be best**. It should translate weather, elevation, surface, operations, and travel signals into a recommendation the skier can understand and verify.

The product is not attempting to win by displaying more raw weather columns. Its advantage should be a narrow, trustworthy decision workflow for volatile East Coast conditions: freeze–thaw cycles, rain transitions, snowmaking windows, elevation differences, wind, operations, distance, and timing.

## Primary user and job

The first target user is a skier choosing among driveable East Coast resorts for the next few days. Their core job is:

> Show me the best realistic ski option for my available day, explain why, and warn me about the tradeoffs.

Secondary jobs are exploring unfamiliar resorts, watching favorite mountains, comparing alternatives, and understanding the underlying forecast.

## Product principles

1. **Decision before data.** Lead with a plain-language verdict, best window, and key risk. Detailed forecast values remain available below.
2. **Mountain-aware.** Elevation and freeze level matter. Base, mid, and peak remain distinct without repeating every metric three times in the first viewport.
3. **Explainable recommendations.** A score must expose its important inputs. AI may summarize validated signals but must not create conditions or operational facts.
4. **Travel-aware, with consent.** Distance and drive time are valuable, but location access is optional. A manually selected origin must work equally well.
5. **Quiet by default.** Alerts should fire only for meaningful changes, not routine forecast churn.
6. **Progressive disclosure.** Compact summaries lead to hourly, daily, model, and source detail.
7. **Trust is visible.** Show freshness, data source, forecast versus observation, uncertainty, and provider attribution.

## Information architecture

```text
SkiTheEast
├── Today
│   ├── Forecast window: Today / Saturday / Sunday
│   ├── Best ski window
│   ├── Ranked driveable alternatives
│   └── Resort detail
├── Explore
│   ├── Search
│   ├── Map / list
│   ├── Region, distance, condition, snowfall, and operations filters
│   ├── Compare selection
│   └── Resort detail
├── Saved
│   ├── Favorite resorts
│   ├── Meaningful-change summary
│   ├── Alert preferences
│   └── Resort detail
└── Preferences
    ├── Home location or manual origin
    ├── Units
    ├── Notification controls
    ├── Appearance
    └── Data sources and privacy
```

Radar is a contextual map layer in Explore and resort detail, not a permanent navigation destination. Compare is an action inside discovery flows, not another tab.

## Core flows

### 1. Decide where to ski

1. Open Today.
2. Choose an available day.
3. Read the best-window verdict and key caveat.
4. Compare ranked alternatives by conditions and travel.
5. Open a resort for a verifiable explanation and detailed forecast.

### 2. Explore near an origin

1. Open Explore.
2. Search or use an optional saved origin.
3. Filter by realistic travel radius and minimum condition quality.
4. Switch between map and ranked list.
5. Select a resort or compare two candidates.

### 3. Inspect a resort

1. Read the day verdict, best window, and operating status.
2. Change base, mid, or peak elevation.
3. Review surface, temperature, fresh snow, and main risk.
4. Expand “Why this recommendation?” for the underlying signals.
5. Save the resort or continue into detailed hourly/daily data.

### 4. Watch favorites

1. Open Saved.
2. See the next meaningful regional change.
3. Review favorite-resort outlooks.
4. Enable narrowly defined alerts such as fresh snow, a good ski window, or a material operations change.

## Screen wireframes

These wireframes define hierarchy rather than visual styling. The high-fidelity expression is in `design/step-2/index.html`.

### Today

```text
┌──────────────────────────────┐
│ SkiTheEast             ○  DK │
│ SATURDAY OUTLOOK             │
│ Your best snow is north.     │
│ One-sentence regional reason │
│ [Today][Saturday][Sunday]    │
│                              │
│ BEST WINDOW          Origin  │
│ ┌──────────────────────────┐ │
│ │ Good · 8–11 AM      82   │ │
│ │ Killington                │ │
│ │ Surface summary           │ │
│ │ Snow | Peak temp | Gusts  │ │
│ └──────────────────────────┘ │
│ WORTH THE DRIVE              │
│ [Ranked resort summary]      │
│ [Ranked resort summary]      │
│                              │
│  Today      Explore    Saved │
└──────────────────────────────┘
```

### Explore

```text
┌──────────────────────────────┐
│ Explore the East             │
│ Find the right mountain.     │
│ [Search resort or region]    │
│ [Map | List]       [Filters] │
│ [Within 5h] [Good+] [Snow]   │
│ ┌──────────────────────────┐ │
│ │       map + score pins    │ │
│ │  spatial viewport results │ │
│ └──────────────────────────┘ │
│  Today      Explore    Saved │
└──────────────────────────────┘
```

### Resort detail

```text
┌──────────────────────────────┐
│ ← Back                ♡ Save │
│ Killington                   │
│ Freshness · provider context │
│ Good · 8–11 AM          82   │
│ [Base] [Mid] [Peak]          │
│ [Surface]       [Weather]    │
│ [Fresh snow]    [Main risk]  │
│ Best-time signal             │
│ [Why this recommendation?]   │
│ Five-day concise forecast    │
└──────────────────────────────┘
```

### Saved

```text
┌──────────────────────────────┐
│ Your mountains               │
│ Watch the next window.       │
│ [Meaningful regional change] │
│ SAVED RESORTS                │
│ [Resort summary]             │
│ [Resort summary]             │
│ ALERT CONCEPTS               │
│ Fresh snow              [on] │
│ Good ski window         [on] │
│ Operations             [off] │
│  Today      Explore    Saved │
└──────────────────────────────┘
```

## Content hierarchy

Every recommendation screen follows the same order:

1. Verdict and best time
2. Material downside or uncertainty
3. Fresh snow and surface implication
4. Temperature, wind, visibility, and rain/freeze risk
5. Operations and travel context
6. Hourly and daily detail
7. Provider, freshness, methodology, and limitations

Avoid leading with a 16-day table. Forecast confidence declines with time, so days beyond the dependable decision horizon should be visually deemphasized and described as outlooks.

## Required interface states

- First run without location permission
- Manual origin selected
- No resorts match current filters
- Forecast loading and partial-provider failure
- Weather available while operations data is unavailable
- Stale forecast with last-successful timestamp
- Resort outside supported region
- Off-season resort state
- Alert permission denied
- Saved list empty
- Offline or temporarily unavailable detail

Provider failure must never turn unknown data into a zero, closed status, or poor condition score.

## Step 2 acceptance criteria

- Today, Explore, Saved, and resort-detail hierarchy is documented.
- The prototype demonstrates the primary navigation and resort-detail flow at a mobile width.
- Light and dark foundations use shared semantic tokens.
- Interactive controls have visible focus states and at least 44-by-44-point targets where applicable.
- Synthetic and future data is conspicuously labeled.
- Current and future backend capabilities are not conflated.
- No file in the deployed `frontend/` or backend runtime is changed by the prototype.
- The prototype works without network access, private keys, or provider calls.

## Implementation handoff

1. Step 3 supplies spatial resort records, viewport/region queries, and nearby distance results.
2. Step 4 creates the Expo shell, navigation, theme tokens, accessible primitives, and current-data resort detail.
3. Step 5 adds MapLibre, radar, and map-specific forecast layers.
4. Later work adds deterministic surface scoring, compare, preferences, persistence, and quiet alerts after their data contracts are documented and tested.

The existing web frontend remains available throughout the mobile build. A production redesign should be a separate, explicit scope rather than a side effect of this prototype.
