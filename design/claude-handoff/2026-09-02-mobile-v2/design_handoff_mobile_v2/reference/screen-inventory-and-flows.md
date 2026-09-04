# Screen inventory and user flows

Twenty-nine screens: twenty product screens, nine interface states. Every screen is a real, reachable screen in `index.html` — nothing in this inventory is a description of something unbuilt.

Selector column gives the `data-screen` value used by `proto.js`.

## Navigation model

Three persistent destinations. Everything else is pushed, presented, or reached through the profile control.

```text
Today ─────────── persistent tab 1
Explore ───────── persistent tab 2   (Map ⇄ List; radar is a layer, not a tab)
Saved ─────────── persistent tab 3
   │
   ├── Resort detail ......... pushed from all three, and from Compare
   ├── Compare .............. action, presented over Explore/Today/detail
   ├── Filters .............. action, presented over Explore
   ├── Alerts ............... pushed from Saved and from Profile
   └── Profile .............. header control, not a tab
          ├── Ski preferences → the four onboarding steps, reused
          ├── Origin and location
          ├── Units and appearance
          ├── Privacy and data
          ├── Sources and methodology
          └── Interface states index  (prototype only)
```

Tab bar is hidden on welcome, the four onboarding steps, origin, filters and compare. It is shown everywhere else, including resort detail, so return context is never lost.

## First run

| # | Screen | Selector | Entry | Exits |
| --- | --- | --- | --- | --- |
| 1 | Welcome and product value | `welcome` | Cold start; Profile → Replay first run | Set up preferences → 2 · Skip → Today |
| 2 | Onboarding 1 — Skiing | `onb-1` | From 1; Preferences → Ability/Terrain | Continue → 3 · Skip all → 6 |
| 3 | Onboarding 2 — Conditions | `onb-2` | From 2; Preferences → Snow/Weather | Continue → 4 · Skip all → 6 |
| 4 | Onboarding 3 — Logistics | `onb-3` | From 3; Preferences → Dates/Drive/Pass/Budget | Continue → 5 · Skip all → 6 |
| 5 | Onboarding 4 — Who's coming | `onb-4` | From 4; Preferences → Group needs | Continue → 6 · Skip → 6 |
| 6 | Origin or manual location | `origin` | From 5; any Skip; Profile; Privacy | Use location → Today · Continue with typed origin → Today |

Onboarding covers the nine preference inputs in four steps: ability, terrain and surface preference (step 1); snow priorities, weather tolerance and wind ceiling (step 2); available days, drive limit, passes and budget (step 3); group needs (step 4). Every step is skippable and every answer is reachable later from Preferences, which deep-links back into the same four screens rather than duplicating them.

## Today

| # | Screen | Selector | Notes |
| --- | --- | --- | --- |
| 7 | Today briefing | `today` | Tab 1. Leading recommendation, constraint chips, alternatives, weekend option, sources |
| — | Why this (inline) | within 7 | Expands under the action row; does not navigate |

First viewport, in order: dated issue line, one-line verdict headline, day selector, active-constraint chips, then the leader card carrying condition label, best window, mountain, drive, primary reason, main risk and confidence. The first alternative peeks below the fold by design.

Everything below the fold: three ranked alternatives, the labelled out-of-limit option, and the source-and-freshness block.

## Explore

| # | Screen | Selector | Notes |
| --- | --- | --- | --- |
| 8 | Explore — map | `explore-map` | Tab 2 default. Placeholder geometry, condition-labelled pins, radar layer toggle |
| 9 | Explore — list | `explore-list` | Same header and filters; ranked alternative to the map |
| 10 | Filters | `filters` | Presented. Date, travel time, region, snow, rain, wind, operations, pass, ability, terrain |
| 11 | Compare | `compare` | Presented. Up to three mountains as one table — pinned metric column, horizontal scroll, rows that grow together |

Map and list share search, view control, filter count and quick chips, so switching never loses context. The radar layer is a toggle inside the map, with pause, frame position and a static alternative; it is never a navigation destination.

## Resort detail

| # | Screen | Selector | Notes |
| --- | --- | --- | --- |
| 12 | Resort detail | `detail` | Pushed. Returns to the screen that opened it |

Order on the screen: region and name, elevation range and pass, freshness chips for weather and operations separately, verdict with confidence, elevation control, four decision cards, freezing-level row, best-time timeline, operations, "Why this recommendation?", five-day forecast, sources.

The elevation control rewrites temperature, apparent temperature, snowfall, wind, gust, freezing-level relation and the surface interpretation. Days beyond the dependable horizon are dimmed and labelled outlook.

## Saved

| # | Screen | Selector | Notes |
| --- | --- | --- | --- |
| 13 | Saved mountains | `saved` | Tab 3. Meaningful-change summary, three saved mountains, link to alerts |
| 14 | Alert controls | `alerts` | Pushed from Saved and Profile. Four narrow triggers, quiet hours, weekly cap |

The change summary leads with the next event that would alter a plan — a named front, its time, and its per-mountain effect — not with a list of current values.

## Profile and preferences

| # | Screen | Selector | Notes |
| --- | --- | --- | --- |
| 15 | Profile | `profile` | Header control. Decision inputs, app settings, prototype tools |
| 16 | Ski preferences | `prefs` | All nine inputs with current values; each row deep-links to its onboarding step |
| 17 | Units and appearance | `units` | Temperature, snow depth, distance, appearance, text-size note |
| 18 | Privacy and data | `privacy` | Permission state, what is stored where, provider keys, erase |
| 19 | Sources and methodology | `sources` | The capability legend: live today, optional provider, illustrative |
| 20 | Interface states index | `states` | Prototype only; lists the nine states |

## Interface states

Each is a real screen, not an annotation.

| # | State | Selector | What it demonstrates |
| --- | --- | --- | --- |
| 21 | Loading | `st-loading` | Skeleton; no value is shown until it arrives, so no zeros read as data |
| 22 | No matches | `st-empty` | Names the filter conflict and offers the smallest resolving change, with counts |
| 23 | Stale forecast | `st-stale` | True age, failed-refresh count, retry, and confidence reduced to one of three |
| 24 | Partial provider | `st-partial` | Weather current, operations unknown, confidence down one step, reason in place of the value |
| 25 | Offline | `st-offline` | Cached briefing with its save time; map, radar and search explicitly unavailable |
| 26 | Location denied | `st-location-denied` | Full product on a typed origin; no upsell, no repeat prompt |
| 27 | Notifications denied | `st-notif-denied` | Triggers preserved as "Set, not sending"; content still available in Saved |
| 28 | Off-season | `st-offseason` | No recommendation; historical opening ranges labelled as such |
| 29 | Not enough data | `st-insufficient` | Rating withheld, missing inputs named, known values still shown |

Two more required states are covered inside product screens rather than as separate ones: **manual origin selected** is screen 6 and the header of screen 26; **saved list empty** is not yet built and is listed as an open item in the handoff.

## Core flows

### 1. Decide where to ski — the primary flow

```text
Today ─► read the leader (label, window, confidence, reason, risk)
      ├─► Why this ......... evidence, preference match, explanation
      ├─► scroll ........... three ranked alternatives, then the out-of-limit option
      ├─► constraint chip .. re-rank with a stated diff
      ├─► Compare .......... leader against two others
      └─► tap any card ..... Resort detail ─► back to Today
```

The flow answers "which mountain, when, and what am I accepting" before any forecast table appears. The re-rank path exists so a user can test their own constraint rather than trusting the filter silently.

### 2. Explore near an origin

```text
Explore ─► Map (radar layer optional)
        ├─► List ........... same filters, ranked
        ├─► Filters ........ ten filter groups ─► Show N mountains
        ├─► Compare ........ up to three
        └─► pin or card .... Resort detail ─► back to Explore
```

### 3. Inspect and verify a mountain

```text
Resort detail ─► verdict and confidence
              ├─► Base / Mid / Summit ...... every value rewrites
              ├─► best-time timeline ....... labelled, common scale
              ├─► Operations ............... unknown stated as unknown
              ├─► Why this recommendation? . inputs → preferences → explanation
              ├─► five days ................ last two dimmed as outlook
              └─► Sources ................... per-provider freshness ─► Methodology
```

### 4. Watch favourites

```text
Saved ─► next meaningful change, with its per-mountain effect
      ├─► saved mountain ─► Resort detail
      └─► Alert settings ─► four triggers, quiet hours, weekly cap
```

## Content order, applied everywhere

Every recommendation surface follows the same sequence, which is what makes the screens feel like one product:

1. Verdict and best time
2. Material downside or uncertainty
3. Fresh snow and its surface implication
4. Temperature, wind, visibility, rain and freeze risk
5. Operations and travel context
6. Hourly and daily detail
7. Provider, freshness, methodology and limitations
