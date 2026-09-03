# Handoff: SkiTheEast mobile v2

## Overview

SkiTheEast is a weather-data-powered decision app for East Coast skiers. It answers one question: **which mountain is best for me, on the day I can ski?**

The product leads with a personalized recommendation, not a wall of weather data. Weather facts and deterministic scoring establish the recommendation; an AI layer explains it and personalizes the tradeoffs, and is never allowed to invent weather, snow, crowd, travel, or operating information.

This bundle contains a 29-screen clickable design prototype covering onboarding, the Today briefing, Explore (map and list), resort detail, compare, saved mountains, alerts, profile/preferences, and nine required interface states.

## About the design files

**The files in `prototype/` are design references created in HTML.** They are prototypes showing intended look and behavior. They are **not production code to copy**.

`prototype/index.html` is a single 243 KB static file with inline styles and a plain `proto.js` interaction controller. It has no build step, no framework, no data layer, and every value in it is hardcoded. It exists to be *looked at and clicked*, not lifted.

**Your task is to recreate these designs in the target codebase's environment using its established patterns** — not to port the HTML.

### Target environment

The repository is `SkiApp`:

- `frontend/index.html` — the current static web client
- `backend/src/` — the TypeScript API (Fastify), with `backend/src/data/resorts.ts` holding the resort catalog and `backend/src/services/` holding the weather/AI adapters
- `docs/` — product and design documentation
- `design/` — design prototypes, including `design/mobile-v2/` which this bundle came from

The intended client for this design is **Expo / React Native**, per the step-2 mobile product definition. That app does not exist yet. If you are creating it, scaffold it as a new top-level directory (e.g. `mobile/`) — do not build it inside `frontend/` or `backend/`.

**Do not modify anything under `design/`.** Those files are the design source of record.

**Do not modify `frontend/` or `backend/` for styling reasons.** Backend changes are in scope only where this handoff calls for a new endpoint or field.

### Fidelity

**High-fidelity.** Colors, typography, spacing, radii, motion timings, and interaction behavior are final and specified exactly below. Recreate the UI faithfully using the target platform's primitives.

Two things are deliberately *not* final and should not be reproduced literally:

1. **The map** is a placeholder — a striped rectangle with a `MAP PLACEHOLDER · NO REAL GEOMETRY` mark. Use a real map library. Keep the pin treatment (labelled by condition word, never colour alone) and keep the ranked-list alternative.
2. **All data values.** See "Real versus illustrative data" — this is the most important section in this document.

---

## Non-negotiable rules

These are product correctness rules, not style preferences. They are the reason the product can claim to be trustworthy. Each one is checkable — treat a violation as a bug.

1. **Unknown is never rendered as zero, closed, or poor.** Not `0`, not "Closed", not a dash that reads as zero, not a grey pill that reads as bad. Render the word "Unknown" or "Not reported" and, where there is room, say explicitly that it is not a closure. A `null` from a provider must stay distinguishable from a real `0` end to end — including through any serialization, default-value, or `??` coalescing you add.
2. **Forecasts are labelled separately from observations.** Every weather value in this product is a forecast from a model run. Never present one as a measurement.
3. **Weather and operations carry separate timestamps.** They come from different providers and fail independently, so they display independently. Never merge them into one "updated N minutes ago".
4. **A rating is withheld, not guessed.** If a required input is missing, render "Not enough data", name the missing inputs, and still show the values you do have. Never interpolate or default a score.
5. **The AI explanation may only restate validated signals.** It cannot introduce a weather, snow, crowd, travel, or operating fact. The recommendation must be complete and defensible with the explanation removed — build that path and test it.
6. **Illustrative data must be labelled as illustrative** wherever it appears, until the real capability ships.

---

## Real versus illustrative data

The prototype shows the intended end state. Most of it is not supported by the current API. Three tiers:

### Tier 1 — Live today

Available from the existing backend with no new provider and no keys.

| Signal | Source |
| --- | --- |
| Resort name, state, coordinates, base/mid/summit elevations | `backend/src/data/resorts.ts` |
| Next 12 hours at each of the three elevations | Open-Meteo adapter |
| Daily forecast at each elevation | Open-Meteo adapter |
| Snowfall, rain, temperature, apparent temperature, wind, gusts, visibility, cloud cover, freezing level | Open-Meteo adapter |

Attribution is required in the client: **"Weather data by Open-Meteo.com, CC BY 4.0."** It is rendered on the methodology screen. Keep it.

Note: elevations are metres in the catalog and feet in the API response. The prototype displays feet.

### Tier 2 — Optional provider

Present only when a key is configured. Coverage is incomplete and unaudited.

| Signal | Notes |
| --- | --- |
| Lift counts, trail counts, snow report, resort status | Own timestamp, separate from weather. Absence renders as "Unknown". |
| Written explanation of a recommendation | Constrained to restating validated signals. Rendered last and visually subordinate. |

### Tier 3 — Illustrative only

**Nothing behind these. They are design concepts.** Every one is labelled illustrative in the prototype, and must stay labelled until the real capability ships:

Condition rating and label · confidence level · best-ski window and the timeline index · surface outlook · drive time and all travel figures · rank order · the "14 in range" and "158 mountains" counts · region names · pass affiliations · meaningful-change detection · alert triggers and the weekly cap · saved mountains · compare · radar · all dates and times, including the 6:12 AM issue time.

**Crowds appear nowhere in the prototype.** No credible source exists, so nothing is inferred and no placeholder is shown. Do not add one.

---

## Design tokens

Declared once as CSS custom properties in the prototype. Port them to whatever token mechanism the target uses. Dark values apply via `prefers-color-scheme` when no explicit choice is stored, and via an explicit override when one is. **Nothing in the UI may hardcode a colour outside this table.**

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--canvas` | `#dfe7e8` | `#071216` | Surround outside the device (prototype chrome only) |
| `--app` | `#f4f7f6` | `#0b171b` | Screen background |
| `--surface` | `#ffffff` | `#102126` | Cards, controls, rows |
| `--surface-raised` | `#f8faf9` | `#14272c` | Tab bar, evidence panels, secondary fills |
| `--text` | `#102329` | `#edf6f4` | Titles and values |
| `--text-soft` | `#52666b` | `#a8bab9` | Explanations, body copy, anything on a tinted fill |
| `--text-faint` | `#5f7378` | `#8ba1a3` | Uppercase kickers and metadata, **on plain grounds only** |
| `--line` | `#dce5e4` | `#23373b` | Dividers and control boundaries |
| `--brand` | `#116b68` | `#67c7bd` | Primary action, positive selection, good conditions |
| `--brand-strong` | `#0a5352` | `#8fddd4` | Text and icons on tinted brand fills |
| `--brand-soft` | `#d7efeb` | `#173d3b` | Selected and good-condition backgrounds |
| `--on-brand` | `#ffffff` | `#07211f` | Text on a solid brand fill |
| `--warning` | `#8f4a23` | `#f2a675` | Meaningful caution — never decorative |
| `--warning-soft` | `#fae8dc` | `#3b281f` | Risk and stale backgrounds |
| `--snow` | `#dff5f8` | `#16383f` | Map placeholder ground |
| `--sky` | `#3f8fa5` | `#76c2d2` | Radar overlay only |
| `--sig-fair` | `#6e8286` | `#8ba1a3` | Neutral condition step between good and caution |
| `--seg-bg` | `#e6eceb` | `#14272c` | Segmented-control trough, unselected chips, badges |
| `--switch-off` | `#aebcbb` | `#3a5257` | Switch track when off |
| `--focus` | `#1f7f96` | `#76c2d2` | Focus ring |

### Contrast rules

`--text-faint` clears AA only on the plain grounds: 4.99:1 on `--surface`, 4.83:1 on `--surface-raised`, 4.63:1 on `--app`. It **fails** on tinted fills — 4.14:1 on `--brand-soft`, 4.17:1 on `--seg-bg`.

So: **any text on a tinted fill uses `--text-soft`** (5.01:1 on `--brand-soft`, 5.06:1 on `--seg-bg`, 5.58:1 on dark `--brand-soft`).

This matters most where a fill changes at runtime. An option row is `--surface` unselected and `--brand-soft` selected, so its description sub-label must clear AA on both — it is `--text-soft` unconditionally, not switched on selection. The same rule puts the `DEMO` provenance badge and the rank badges on `--text-soft`: they sit on `--seg-bg`, and a 10.5px badge at weight 800 is not "large text" under WCAG, so the 3:1 allowance does not apply.

The current set measures 0 failures in both foundations via a per-element nearest-opaque-ancestor walk across all 29 screens. Keep it there.

### Type

System UI: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`.
Monospace (`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`) is used **only** for prototype scaffolding and provenance notes, never for product content.

| Role | Size | Weight | Tracking |
| --- | --- | --- | --- |
| Screen title | 26–30 px | 800 | −0.038em |
| Verdict title (mountain name) | 26 px | 800 | −0.035em |
| Section title | 17 px | 750 | −0.025em |
| Card title | 15–21 px | 750–800 | −0.02em |
| Body | 13.5–14.5 px | 400–650 | — (line-height 1.45–1.55) |
| Supporting | 11.5–12.5 px | 650–700 | — |
| Metadata / kicker | 11 px | 700–800 | +0.07em, uppercase |

**Nothing renders below 10.5 px.** Every uppercase kicker is 11 px, including the metric labels on resort cards — those labels are what tell the user what the numbers mean.

Every numeric value in a column or comparison uses tabular figures. Every paragraph of prose uses `text-wrap: pretty` or the platform equivalent.

### Spacing, shape, targets

Base unit 4 px. Scale in use: 7, 8, 9, 11, 12, 14, 16, 18, 20, 22, 24, 26.

| Radius | Value | Applied to |
| --- | --- | --- |
| Control | 9–14 px | Buttons, rows, segmented options, small cards |
| Card | 15–16 px | Resort summaries, decision cards, settings rows |
| Emphasis | 20–22 px | Verdict cards, map canvas, change summary |
| Pill | 999 px | Chips, condition labels, switches |

**Minimum interactive target 44 × 44.** Where a control looks smaller, the hit area is padded to 44 or the whole row carries the action. Two documented exceptions, both non-product: the inline "Capability legend" prose link, and the state-screen "Exit" scaffolding.

Shadows appear exactly twice: the device frame (prototype chrome) and map pins. Everywhere else, hierarchy comes from border and surface contrast. Do not add elevation.

### Motion

| Interaction | Duration |
| --- | --- |
| Screen entry | 190 ms, 6 px rise + fade |
| Selection, switch, disclosure | 180 ms |
| Toast | 1900 ms visible |

Under reduced-motion, every animation and transition collapses to ~0 and screen entry is **skipped**, not shortened. Radar playback is user-controlled and never autoloops.

---

## Navigation model

Three persistent destinations. Everything else is pushed, presented, or behind the profile control.

```
Today ─────────── tab 1
Explore ───────── tab 2   (Map ⇄ List; radar is a layer, not a tab)
Saved ─────────── tab 3
   ├── Resort detail ....... pushed from all three, and from Compare
   ├── Compare ............. action, presented
   ├── Filters ............. action, presented over Explore
   ├── Alerts .............. pushed from Saved and Profile
   └── Profile ............. header control, not a tab
          ├── Ski preferences → deep-links into the 4 onboarding steps
          ├── Origin and location
          ├── Units and appearance
          ├── Privacy and data
          └── Sources and methodology
```

The tab bar is hidden on welcome, the four onboarding steps, origin, filters, and compare. It is visible everywhere else **including resort detail**, so return context is never lost.

Resort detail records the screen it was opened from and returns there. Explore always enters at Map.

`reference/screen-inventory-and-flows.md` has the full 29-screen inventory with entry points and the four core flows.

---

## Key components

The prototype HTML is the source of truth for exact values. These are the components whose *behavior* carries product meaning.

### Verdict card — the centre of the product

Fixed content order:

1. Condition label (pill) + best window, on one baseline
2. Mountain name (26 px / 800)
3. Region · summit elevation · drive time
4. Primary reason, 1–2 sentences, 14 px
5. Main risk in a `--warning-soft` block with a `△` mark
6. Divider, then confidence: word label left, three-segment bar right

Radius 22 px, `--surface`, 1 px `--line` border, 16–17 px padding.

**There is no numeric score.** An earlier design showed `82/100` in a 62 px ring; it was removed because it implied a calibrated instrument that does not exist. If a score is ever introduced, it is a product decision (see open questions), not a visual one.

### Confidence indicator

Word **plus** a three-segment bar, always together, with an accessible label naming both ("Confidence: high, three of three"). Values: High, Moderate, Low, or "Lowered — stale". **Never a percentage.**

Segments fill with `--brand`, or `--warning` when confidence is reduced by data age. Confidence drops one step per missing required input, and to one segment when data is stale. What lowered it is always stated in the evidence expand.

### Condition label

| Variant | Fill | Text |
| --- | --- | --- |
| Very good | `--brand` solid | `--on-brand` |
| Good | `--brand-soft` | `--brand-strong` |
| Fair | `--seg-bg` | `--text-soft` |
| Rain risk / caution | `--warning-soft` | `--warning` |
| Not enough data | `--seg-bg` | `--text-soft` |

**Condition is never carried by hue alone.** Every rating, pin, timeline bar, and confidence indicator is paired with a word.

### Constraint chip strip (Today)

Horizontally scrolling row of the active preferences shaping the current ranking. Each chip is tappable to loosen. This is the mechanism that makes preferences *visible* rather than merely claimed — it is a required feature, not decoration.

Loosening the drive limit must, in one step:

1. Recolour the chip to `--warning` and relabel it ("Drive limit off")
2. Move the out-of-limit mountain into rank 1, keeping its "Outside your 2 hr 30 min limit" flag
3. Renumber the remaining alternatives from 2
4. Show a diff line naming what moved, its real drive time, and what it displaced
5. Drop the previous leader to 55% opacity with a note beneath it — **dimmed, not removed**, so the comparison stays legible

Tapping again reverses all five. Do not animate the reorder beyond a brief cue; the diff text carries the meaning.

### Evidence disclosure ("Why this recommendation?")

Collapsed by default. Inline expand — not a sheet, not a push. Fixed order:

1. Deterministic inputs as label–value pairs, **including inputs that are missing**
2. Which of the nine preferences matched, and which could not be checked
3. The written explanation in a `--brand-soft` block, with a note stating it may only restate the signals above

The explanation is last and visually subordinate on purpose.

### Compare table — read this before rebuilding it

Requirement: a metric column that stays put while three mountain columns scroll sideways.

The obvious build — four independent flex columns — only aligns if every row height is hardcoded identically, which clips prose cells as soon as text scales. **Do not build it that way.**

It is built as a single `<table>`: one row per metric, the metric cell `position: sticky; left: 0`, the wrapper `overflow-x: auto`, column widths as `min-width` so a column widens rather than clips. Rows size to their tallest cell, so the pinned column and the scrolling columns cannot desync.

Verified: 13 rows, 0 clipped cells, all row heights synced at 1.0×, 1.6×, and 2.0× text, and with a column hidden.

On the target platform, use whatever gives you **shared row sizing** — a grid with `grid-template-rows`, or a table. Independent columns are the trap.

Note: the dismiss control lives inside the column it removes, so it cannot be its own undo. Removal reveals a **Restore** action in the bar.

### Operations block

The single most important component for rule 1. When nothing is reported: dashed border, three fields reading "Unknown", and a sentence saying explicitly that this is not a closure.

### Best-time timeline

Five labelled time buckets, bar height on a common relative scale, **each bar carrying a word** (Firm, Good, Good, Fair, Windy). A footnote states the height is a relative index, not a measured value. The whole strip carries a text description of the sequence.

### Source and freshness block

At the foot of every data-bearing screen, and as chips near the content it qualifies on resort detail. Always separates weather from operations, always states forecast vs observation, always gives a retrieval time, always names what is illustrative.

---

## State management

### Persisted (device-local — there is no account)

| Key | Contents |
| --- | --- |
| Preferences | The nine inputs: ability, terrain, snow priorities, weather tolerance, wind ceiling, available days, drive limit, passes, budget, group needs |
| Origin | Coordinates or typed place, plus a recents list |
| Saved mountains | Resort ids |
| Units | Temperature, snow depth, distance |
| Appearance | `system` \| `light` \| `dark` (prototype key: `skitheeast-v2-appearance`) |
| Alert switches | Per-trigger enabled state, quiet hours |

### Sent to the server

A resort identifier when a mountain is opened, so its forecast can be fetched. **Not the user's position, not their preferences.** The privacy screen states this; keep it true.

### Per-screen state

- Today: selected day, per-constraint loosened flag, evidence expanded, ranked list order
- Explore: view (map/list), search query, filter set, radar layer on/off
- Resort detail: selected elevation (base/mid/summit), evidence expanded
- Compare: 2–3 selected resort ids, per-column hidden flag
- Filters: draft filter state, committed on "Show N mountains", discarded on Cancel

### Loading and failure

Every data-bearing screen needs: loading, loaded, stale, partial-provider, offline, and insufficient-data. All six are designed — see the nine state screens in the prototype (`st-loading`, `st-empty`, `st-stale`, `st-partial`, `st-offline`, `st-location-denied`, `st-notif-denied`, `st-offseason`, `st-insufficient`).

---

## Accessibility

- Visible 3 px `--focus` ring at 2 px offset on every interactive element. No platform default ring survives.
- Native roles and state throughout: tablist/tab with selected, radiogroup/radio with checked, switch with checked, expanded on disclosures, current-page on the active tab, pressed on toggles.
- Charts and maps carry descriptive labels and have list alternatives.
- Decorative marks are hidden from assistive tech.
- Toasts live in a polite live region.
- Icons are geometric strokes at 21 px **paired with text labels**; the tab bar never relies on the glyph alone.
- **Layouts grow vertically.** No fixed height on any element containing prose, no ellipsis, no line clamping. Decision cards use min-height, never height. This is what makes 200% text usable and it is easy to break — treat any fixed height on a text container as a defect.

---

## Voice

Short, observable, never anthropomorphic — written as a person who has skied there would say it. Actual copy from the prototype:

- "Coldest overnight air of any mountain inside your limit."
- "Summit wind builds after noon; gusts to 29 mph."
- "This is not a closure — we have no information either way."
- "Best conditions in range of a weekend, not a day trip."
- "A fabricated rating here would be worse than none."

Avoid: hype, guarantees, certainty without evidence, and any framing that gives the explanation layer a personality or an opinion of its own.

---

## Recommended implementation order

Sequenced so each step ships something verifiable and nothing depends on an unbuilt provider. Full detail in `reference/design-handoff.md` §5.

1. **Foundations** — app shell, three-destination navigation, pushed detail with return context, the token sheet with both foundations, and accessible primitives (segmented control, switch, radio group, disclosure, condition pill, confidence indicator). Prove 200% text and reduced motion here. No product data.
2. **Resort detail on real data** — elevation control, four decision cards, freezing level, five-day forecast with deemphasis, source-and-freshness with separate timestamps. Deliberately **no rating and no timeline** — this step proves the forecast plumbing and the unknown-handling rules. Ship states `st-loading`, `st-stale`, `st-partial`, `st-offline`, `st-insufficient` alongside it; failure states are cheapest to build with the success path.
3. **Preferences and origin** — four onboarding steps, preferences hub, manual origin, units, privacy, device-local persistence. Ship `st-location-denied`.
4. **Explore as a ranked list** — list, search, and only the filters whose data exists (date, snow, rain, wind, operations). Ship `st-empty`. No map yet; the list is the honest first version and the map's accessible alternative regardless.
5. **Spatial layer** — resort geography, radius and viewport queries, distance. Then the map. Straight-line distance first; routed drive time only once a provider and its terms are settled.
6. **Scoring and the Today briefing** — only now. A versioned deterministic model with documented inputs, weights, uncertainty behavior, failure modes, and tests. Then the condition label, confidence, timeline, ranked briefing, and evidence disclosure. Ship `st-offseason`.
7. **Explanation layer**, if it ships at all.
8. **Saved, compare, alerts** — favourites and the change summary, then compare, then alerts with persistence, scheduling, deduplication, and push. Ship `st-notif-denied` and the missing saved-empty state.
9. **Radar**, last.

**Step 6 is the product's centre and it is deliberately last.** Everything above it is what makes it verifiable.

---

## Open questions — resolve with the product owner, do not guess

1. **Is a numeric score ever shown?** Currently no. Decide before specifying the scoring model; it changes the output contract.
2. **Is the drive limit hard or soft?** Currently hard, with a visible loosening escape hatch and a labelled out-of-limit section.
3. **What counts as a meaningful change?** Alert thresholds, deduplication window, and the definition of "the same event" are all placeholders (4 in / 24 h, Good-or-better transition, max 3 per week).
4. **Region taxonomy does not exist.** The prototype filters by eight regions; the catalog has no region field. The filter cannot ship without a taxonomy and an assignment for every mountain.
5. **Pass affiliation does not exist** in the catalog, is licensing-sensitive, and changes yearly. Maintained field, user annotation, or cut?
6. **Ability and terrain matching has no data behind it.** Needs trail difficulty distribution and a glade/mogul/park/beginner inventory. Until then those two preferences can only reorder, not filter.
7. **Reconcile the resort count.** The repo README says 158; `backend/src/data/resorts.ts` may not contain that many. The prototype prints 158 in two places. Verify and fix the copy — a wrong count on the welcome screen is a credibility problem in a product whose whole argument is trustworthiness.
8. **What is the dependable decision horizon?** Currently three days selectable, days 4–5 dimmed as outlook. The cut point is a meteorological judgement not yet made.
9. **Does the explanation layer ship in v1?** It is optional, costs per request, and the recommendation stands without it.
10. **The saved-empty state is not designed.** It is required and missing — add it.
11. **Does compare selection persist** across sessions and tabs, or is it transient?
12. **Off-season opening dates** — currently historical ranges labelled as such. Confirm the source.

---

## Assets

**None.** No images, icon files, or fonts are bundled or required.

- Icons are inline SVG geometric strokes (21 px, stroke-width ~1.9). Replace with the target platform's icon set at equivalent weight.
- Type is the system UI stack — nothing to load.
- The map is a CSS placeholder, not an image.
- No photography is used anywhere.

## Files in this bundle

| Path | What it is |
| --- | --- |
| `prototype/index.html` | The clickable prototype — 29 screens, self-contained apart from `proto.js` |
| `prototype/proto.js` | The interaction controller, dependency-free. Read this for exact interaction behavior. |
| `reference/screen-inventory-and-flows.md` | All 29 screens with entry points and exits, plus the four core flows |
| `reference/component-and-token-reference.md` | Token table with measured contrast ratios, and the component inventory with their rules |
| `reference/design-handoff.md` | The original design handoff: interactions, responsive behavior, data tiers, open decisions, implementation order |

### Running the prototype

```bash
cd prototype
python3 -m http.server 4173
```

Then <http://127.0.0.1:4173>. Opening `index.html` from disk also works.

The panel left of the phone is **prototype scaffolding, not product UI**. It jumps to any screen or interface state and switches appearance. Inside the phone, `DK` in the header opens Profile.

Worth clicking specifically: the **Under 2 hr 30 min** chip on Today (the re-rank), **Why this** on Today and resort detail, the **Summit/Mid/Base** control on resort detail, **Radar layer** on Explore, and the sideways scroll on **Compare**.

## Source of record

This bundle was generated from `design/mobile-v2/` in the `SkiApp` repository. If they diverge, that directory wins. Related documentation:

- `docs/product/step-2-mobile-product.md` — mobile product definition
- `docs/product/step-2-data-capability-matrix.md` — the authoritative capability boundary
- `docs/design/step-2-design-system.md` — the design system this inherits from
