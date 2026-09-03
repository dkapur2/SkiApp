# Handoff — SkiTheEast mobile v2

For the engineer building the Expo client and the product owner sequencing it. Read alongside [`screen-inventory-and-flows.md`](screen-inventory-and-flows.md) and [`component-and-token-reference.md`](component-and-token-reference.md).

---

## 1. Interactions

Everything below is implemented in `proto.js` and can be read there directly. The controller is deliberately free of framework code so the behaviour, not the implementation, transfers.

### Navigation

| Behaviour | Detail |
| --- | --- |
| Tab switch | Sets the destination and resets scroll to top. Explore always enters at Map. |
| Push | Resort detail, alerts, and the profile subscreens record the screen they were opened from and return to it. `previous` is only updated for tab-level screens, so returning from detail after visiting Compare still lands correctly. |
| Present | Filters and Compare hide the tab bar. Filters returns to Explore list; Compare returns to its opener. |
| Screen entry | 6 px rise plus fade over 190 ms. Skipped entirely under reduced motion, not shortened. |
| Scroll | Only the content region scrolls. Status bar, header and tab bar are fixed by flex layout, not by position. |

### Constraint loosening — the one interaction to get exactly right

Tapping the drive-limit chip on Today:

1. The chip recolours to `--warning` and its label becomes "Drive limit off".
2. Killington moves out of "Outside your limit" into position 1 of the ranked list, keeps its "Outside your 2 hr 30 min limit" flag, and its rank badge becomes a filled `1`.
3. The remaining alternatives renumber from 2.
4. A diff line appears above the leader card naming what moved, its real drive time, and what it displaced.
5. The previous leader card drops to 55 percent opacity with a note beneath it, rather than being removed.

Tapping again reverses all five. The point of the interaction is that the user can test their own constraint and see the cost, so the reversal must be as clear as the application. Do not animate the list reorder beyond a brief cue — the diff text is what carries the meaning.

Other chips currently toast "Loosening this constraint does not change the ranking", which is honest for this data set. In production every chip re-ranks.

### Disclosure, selection, state

| Control | Behaviour |
| --- | --- |
| Evidence disclosure | `aria-expanded` toggles, marker rotates 90°, label swaps between "Why this" / "Hide why". Collapsed by default on every screen. |
| Segmented control | Single selection, `aria-selected` on all options. The elevation control rewrites nine values including the surface interpretation. |
| Radio group | `data-radio="single"` for one-of, `"multi"` for any-of. Same visual language, different semantics — the prototype uses `role="radio"` only for genuine single-select. |
| Switch | Track colour and 20 px knob translation over 180 ms. The unavailable operations alert is `aria-disabled`, visible at 60 percent, with its reason stated. |
| Save | Toggles `aria-pressed`, swaps label to "Saved", tints from the brand ramp, and raises a `role="status"` toast for 1.9 s. |
| Radar layer | Adds the overlay, reveals playback controls and the no-provider note together. Never autoplays or loops. |
| Compare dismiss | Hides that mountain's cells and toasts. Because the dismiss control lives inside the column it removes, the path back is the **Restore** action that appears in the bar — never destructive without a way back, but the way back is deliberately not the button that vanished. |
| Appearance | System, Light or Dark, persisted to `localStorage` under `skitheeast-v2-appearance`. System is the default. |

---

## 2. Responsive behaviour

The prototype is authored at exactly 390 × 844 because that is the target. Three things must hold as the real device varies.

**Width.** All horizontal layout is flex or grid with `gap`. Nothing depends on a 390 px measurement. Card grids are `repeat(3, 1fr)` or `repeat(2, 1fr)` and reflow at any width. The two horizontally scrolling regions — constraint chips and compare columns — are the only places that intentionally exceed the viewport, and both hide their scrollbars while remaining swipeable and keyboard-reachable.

**Height.** The device is a flex column: fixed status bar, fixed header, `flex: 1; min-height: 0` scroll region, fixed tab bar. A shorter device takes it out of the scroll region only. The Today first viewport is composed to fit roughly 600 px of content height; on a shorter screen the alternatives peek less, which is a graceful degradation of the intended affordance rather than a break.

**Text size.** Every text container grows vertically. There is no `text-overflow: ellipsis`, no line clamping, and no fixed height on any element containing prose. Decision cards use `min-height`, never `height`. This is what makes 200 percent text usable, and it is easy to break — treat any fixed height on a text container as a defect.

The compare table is the one surface where this is structurally load-bearing, and it is worth understanding before reimplementing it. The requirement is a metric column that stays put while three mountain columns scroll sideways. The obvious build — four independent flex columns — only aligns if every row height is hard-coded identically, which clips the prose cells ("Packed powder, wind-affected up high", the mountain headers) as soon as text scales. It is built here as a single `<table>` instead: one row per metric, the metric cell `position: sticky; left: 0`, the wrapper `overflow-x: auto`. Rows size to their tallest cell, so the pinned column and the scrolling columns cannot desync and nothing clips at any text size. Reproduce that structure — a grid with shared `grid-template-rows` is the other correct option — rather than reaching for independent columns.

Tablet and landscape are out of scope for this phase. The safe assumption is that this layout centres in a 390–430 px column rather than stretching.

---

## 3. Real versus illustrative data

The single most important section for review. The prototype's **Sources and methodology** screen (`sources`) renders this same split in-product; keep the two in step.

### Live today — Open-Meteo and the resort catalog

| Signal | Source | Notes for implementation |
| --- | --- | --- |
| Name, state, coordinates, three elevations | `backend/src/data/resorts.ts` | Elevations are metres in the catalog, feet in the API response. The prototype shows feet. |
| Next 12 hours at base, mid, summit | Open-Meteo adapter | Already elevation-aware. |
| Daily forecast at each elevation | Open-Meteo adapter | Deemphasise beyond the decision horizon (see open decision 8). |
| Snowfall, rain, temperature, apparent temperature, wind, gusts, visibility, cloud, freezing level | Open-Meteo adapter | Null and zero must stay distinguishable end to end. A null snowfall is not 0.0 in. |

Attribution is required and is rendered on the methodology screen: weather data by Open-Meteo.com, CC BY 4.0. Keep it in the client.

Every one of these is a **forecast**, not an observation. The prototype says so on Today, on resort detail, and in every source block. Do not let that wording get dropped as a space saving.

### Optional provider — present only when configured

| Signal | Notes |
| --- | --- |
| Lift counts, trail counts, snow report, resort status | Coverage is incomplete and unaudited. Carries its own timestamp, separate from weather. Absence renders as "Unknown", never zero or closed. Screens 12, 24 and 29 show the three cases. |
| Written explanation of a recommendation | Constrained to restating validated signals. Rendered last and subordinate. The recommendation must stand with the explanation removed — test that path. |

### Illustrative — concepts only, nothing behind them

Condition rating and label · confidence level · best-ski window and the timeline index · surface outlook · drive time and every travel figure · rank order · the "14 in range" and "158 mountains" counts · region names · pass affiliations · meaningful-change detection · alert triggers and the weekly cap · saved mountains · compare · radar · all dates, times and the 6:12 AM issue time.

Crowds appear nowhere in this prototype. There is no credible source, so nothing is inferred and no placeholder is shown.

### Four rules the implementation must not break

1. **Unknown is not zero.** Not zero, not closed, not poor, not a dash that reads as zero. Screens 24 and 29 are the reference.
2. **Forecast is not observation** unless explicitly labelled.
3. **Weather and operations carry separate timestamps.** They fail independently and must display independently.
4. **A rating is withheld, not guessed.** "Not enough data" with the missing inputs named.

---

## 4. Unresolved product decisions

Ordered by how much they block implementation.

1. **Is a numeric score ever shown?** This prototype removed step 2's `82/100` and leads with a qualitative label plus three-step confidence. That is a product decision, not a visual one — a number invites precision the model will not have for a long time. Decide before the scoring model is specified, because the answer changes its output contract.
2. **Is the drive limit hard or soft?** Currently hard, with a visible loosening escape hatch and a labelled out-of-limit section. The alternative — letting a dramatically better mountain lead with its distance flagged — is defensible and would change the Today hierarchy.
3. **What counts as a meaningful change?** Alert triggers need signed-off numeric thresholds, a deduplication window, and a definition of "the same event". The prototype asserts 4 in / 24 h, a Good-or-better transition on an available day, and at most three notifications a week. All three are placeholders.
4. **Region taxonomy does not exist.** The prototype filters by Poconos, Endless Mountains, Catskills, Laurel Highlands, Berkshires, Green Mountains, White Mountains, Adirondacks. The catalog has no region field. Someone must define the taxonomy and assign every mountain, or the filter cannot ship.
5. **Pass affiliation does not exist** in the catalog either, and it is licensing-sensitive and changes yearly. Decide whether it is a maintained field, a user annotation, or cut.
6. **Ability and terrain matching has no data behind it.** Ranking by ability needs trail difficulty distribution; ranking by terrain needs a glade, mogul, park and beginner-area inventory. Neither exists. Until they do, those two preferences can only reorder, not filter — which is what the prototype's Preferences screen says. Confirm that is acceptable for v1.
7. **Reconcile the resort count.** The repository README says 158; `backend/src/data/resorts.ts` does not obviously contain that many. The prototype prints 158 in two places. Verify the real number and fix the copy — a wrong count in the welcome screen is a credibility problem in a product whose whole argument is trustworthiness.
8. **What is the dependable decision horizon?** The prototype shows three days in the selector and dims days four and five as outlook. The cut point is a meteorological judgement nobody has made yet.
9. **Does the explanation layer ship in v1 at all?** It is optional, costs money per request, and the recommendation is designed to stand without it. Shipping without it is a legitimate v1.
10. **The saved-empty state is not designed.** It is a required state and is missing. Add it before this set is considered complete.
11. **Does compare selection persist** across sessions and across tabs, or is it transient? Affects whether it needs storage.
12. **Off-season opening dates.** The prototype shows historical ranges labelled as such. Confirm that is acceptable rather than showing nothing, and decide the source.

---

## 5. Recommended implementation order

Sequenced so each step ships something verifiable and nothing depends on an unbuilt provider.

**1 — Foundations.** Expo shell, three-destination navigation, pushed detail with return context, the token sheet with both foundations following the system setting, and accessible primitives: segmented control, switch, radio group, disclosure, condition pill, confidence indicator. Prove 200 percent text and reduced motion here, not later. No product data yet.

**2 — Verifiable resort detail on real data.** Screen 12 against the current API: elevation control, the four decision cards, freezing level, five-day forecast with deemphasis, and the source-and-freshness block with separate weather and operations timestamps. Deliberately no rating and no best-time timeline — this step proves the forecast plumbing and the unknown-handling rules. Ship states 21, 23, 24, 25 and 29 with it, because failure states are cheapest to build alongside the success path.

**3 — Preferences and origin.** The four onboarding steps, the preferences hub, manual origin, units, privacy, and local-first persistence. Ship state 26. Nothing here needs a new provider, and it unblocks every personalisation claim.

**4 — Explore as a ranked list.** List view, search, and only the filters whose data exists — date, snow, rain, wind, operations. Region, pass, ability and terrain wait on open decisions 4, 5 and 6. Ship state 22. No map yet; the list is the honest first version and the map's accessible alternative regardless.

**5 — Spatial layer.** Resort geography, radius and viewport queries, distance. Then the map view, with pins labelled by condition. Straight-line distance first; routed drive time only once open decision 2 and the provider terms are settled.

**6 — Scoring and the Today briefing.** Only now. A versioned deterministic model with documented inputs, weights, uncertainty behaviour, failure modes and tests, then the condition label, confidence, best-time timeline, the ranked briefing and the evidence disclosure. Ship state 28. This is the product's centre and it is last on purpose: everything above it is what makes it verifiable.

**7 — Explanation layer,** if decision 9 says yes. Constrained to the structured signals from step 6, with the recommendation still complete without it.

**8 — Saved, compare, alerts.** Local favourites and the change summary, then compare, then quiet alerts with persistence, scheduled evaluation, deduplication and APNs. Ship state 27 and the missing saved-empty state.

**9 — Radar,** last. Licensed provider or public pipeline, tiles, attribution, cost controls, and the pause and static requirements from the design system.

---

## 6. What was carried forward from step 2, and what changed

Preserved because it was right: the semantic token set and both foundations, the three-destination IA with radar as a layer and compare as an action, verdict-before-data content order, 44 pt targets, visible focus, the reduced-motion block, and the voice.

Changed, with reasons:

| Change | Reason |
| --- | --- |
| Score circle removed | A 62 px ring reading `82/100` implied a calibrated instrument. The capability matrix says no such instrument exists. Qualitative label leads; confidence is three steps. |
| Gradient verdict card and glow shadows flattened | The design system says shadows are subtle and rare and that border and surface contrast carry hierarchy. Step 2 contradicted its own rule. |
| Provenance split three ways | One blanket "illustrative" note let capability tiers blur together. Live, optional-provider and illustrative are now distinguished in-product. |
| Separate weather and operations timestamps | The matrix requires it; step 2 showed one combined "updated 9 minutes ago". |
| Operations unknown state built | Step 2 showed "Open · 124 of 155 trails" with no unknown case, which is the exact failure the rules forbid. |
| `--warning` darkened, `--focus` darkened | Neither met contrast on the light foundation at body size. |
| Day-trip framing | Step 2 led with a mountain 5 hr 12 min away for a user in Philadelphia. The leader is now inside the stated drive limit, with the better-but-farther option kept and labelled. |
| Hero mountain changed | Elk Mountain, 2 hr 28 min, is the best realistic day trip from Philadelphia in this scenario. It makes the product's argument better than Killington did: the closest is not the best, and the best is not the farthest. |
