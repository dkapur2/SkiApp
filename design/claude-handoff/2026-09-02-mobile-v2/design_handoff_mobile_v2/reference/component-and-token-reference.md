# Component and token reference

Inherited from [`docs/design/step-2-design-system.md`](../../docs/design/step-2-design-system.md). The palette, spacing scale, radii and voice are unchanged. This document records the additions this prototype needed and the component rules it applies.

## Semantic color tokens

Declared once in the `:root` block of `index.html`. Dark values apply through `prefers-color-scheme` when no explicit choice is set, and through `[data-theme="dark"]` when one is. Nothing in the prototype hard-codes a colour outside this table.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--canvas` | `#dfe7e8` | `#071216` | Surround outside the device |
| `--app` | `#f4f7f6` | `#0b171b` | Screen background |
| `--surface` | `#ffffff` | `#102126` | Cards, controls, rows |
| `--surface-raised` | `#f8faf9` | `#14272c` | Tab bar, evidence panels, secondary fills |
| `--text` | `#102329` | `#edf6f4` | Titles and values |
| `--text-soft` | `#52666b` | `#a8bab9` | Explanations and body copy |
| `--text-faint` | `#5f7378` | `#8ba1a3` | Metadata only — never a decision value |
| `--line` | `#dce5e4` | `#23373b` | Dividers and control boundaries |
| `--brand` | `#116b68` | `#67c7bd` | Primary action, positive selection, good conditions |
| `--brand-strong` | `#0a5352` | `#8fddd4` | Text and icons on tinted brand fills |
| `--brand-soft` | `#d7efeb` | `#173d3b` | Selected and good-condition backgrounds |
| `--on-brand` | `#ffffff` | `#07211f` | Text on a solid brand fill |
| `--warning` | `#8f4a23` | `#f2a675` | Meaningful caution — never decorative |
| `--warning-soft` | `#fae8dc` | `#3b281f` | Risk and stale backgrounds |
| `--snow` | `#dff5f8` | `#16383f` | Map placeholder ground |
| `--sky` | `#3f8fa5` | `#76c2d2` | Radar overlay only |

### Added in this prototype

Four tokens the step-2 sheet did not cover. Each exists because a state in this prototype could not be expressed without it.

| Token | Light | Dark | Why it was needed |
| --- | --- | --- | --- |
| `--sig-fair` | `#6e8286` | `#8ba1a3` | A neutral condition step between good and caution. Fair conditions are the East Coast norm and must not read as either brand-positive or warning-negative. |
| `--seg-bg` | `#e6eceb` | `#14272c` | Segmented-control and unselected-chip trough. Step 2 hard-coded these two values inline. |
| `--switch-off` | `#aebcbb` | `#3a5257` | Switch track when off. Previously hard-coded. |
| `--focus` | `#1f7f96` | `#76c2d2` | Focus ring. Step 2 used `#66b6c7`, which does not reach 3:1 against white; darkened for the light foundation. |

`--text-faint` was darkened from step 2's `#7a8e92` to `#5f7378`. The original measured 3.44:1 on `--surface` and 3.19:1 on `--app` — under the 4.5:1 AA floor — and it was carrying the unknown-state values, which are decision content. The replacement clears 5.00:1 and 4.64:1 respectively.

**`--text-faint` is only safe on the three plain grounds.** Measured: 4.99:1 on `--surface`, 4.63:1 on `--app`, 4.83:1 on `--surface-raised` — and **4.14:1 on `--brand-soft`, 4.17:1 on `--seg-bg`**, both of which fail. Any text on a tinted fill uses `--text-soft` instead (5.01:1 on `--brand-soft`, 5.06:1 on `--seg-bg`, 5.58:1 on dark `--brand-soft`).

This matters most where a fill changes at runtime. An option row is `--surface` unselected and `--brand-soft` selected, so its description sub-label must clear AA on both — it is `--text-soft` unconditionally rather than being switched on selection. Same rule put the `DEMO` provenance badge and the ranked-alternative rank badges on `--text-soft`: both sit on `--seg-bg`, and a 10.5px badge at weight 800 is not "large text" under WCAG, so the 3:1 allowance does not apply.

The whole set measures clean: a per-element nearest-opaque-ancestor walk across all 29 screens returns 0 failures in both foundations.

`--warning` was darkened from step 2's `#a4562a` to `#8f4a23` so that warning-coloured body copy on `--warning-soft` clears AA rather than sitting just under it. The dark-foundation value is unchanged, and `--text-faint` was lightened slightly on the dark foundation for the same reason.

### Rules

- Condition is never carried by hue alone. Every rating, pin, timeline bar and confidence indicator is paired with a word: Good, Fair, Very good, Windy, Rain risk, Not enough data.
- `--text-faint` is reserved for uppercase kickers and metadata **on a plain ground**. Every unknown-state value — "Unknown", "Not reported", "Not enough data", the unranked `—` badge — uses `--text-soft` (6.05:1), because those are decision content, not metadata. Anything on a tinted fill uses `--text-soft` regardless of role.
- Two condition colours plus one neutral is the whole condition palette. There is no five-step colour scale, because the model behind it does not exist.

## Type

System UI throughout — `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif` — with `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` used only for prototype scaffolding and provenance notes, never for product content.

| Role | Size | Weight | Applied to |
| --- | --- | --- | --- |
| Screen title | 26–30 px | 800 | Screen `h1`; `-0.038em` tracking |
| Verdict title | 26 px | 800 | Recommended mountain name |
| Section title | 17 px | 750 | `h2` section heads |
| Card title | 15–21 px | 750–800 | Resort names, decision card values |
| Body | 13.5–14.5 px | 400–650 | Reasons, explanations, helper copy — line height 1.45–1.55 |
| Supporting | 11.5–12.5 px | 650–700 | Card metadata, list detail |
| Metadata | 11 px | 700–800 | Kickers, uppercase labels, provenance |

Nothing renders below 10.5 px, and every uppercase kicker is 11 px — including the metric labels on resort cards, which are what tell the user what the numbers mean.

Every numeric value that appears in a column or comparison carries `font-variant-numeric: tabular-nums`. Every paragraph of prose carries `text-wrap: pretty`.

Layouts grow vertically. No condition explanation is clipped, truncated or given a fixed height, which is what keeps the screens usable at 200 percent text size.

## Spacing, shape, targets

Base unit 4 px; the scale in use is 7, 8, 9, 11, 12, 14, 16, 18, 20, 22, 24, 26.

| Radius | Value | Applied to |
| --- | --- | --- |
| Control | 9–14 px | Buttons, rows, segmented options, small cards |
| Card | 15–16 px | Resort summaries, decision cards, settings rows |
| Emphasis | 20–22 px | Verdict cards, map canvas, change summary |
| Pill | 999 px | Chips, condition labels, switches |
| Device | 44 px | Prototype frame only |

Minimum interactive target is 44 × 44, including the compare column dismiss (a 22 px glyph in a 44 × 44 button pulled back with negative margins) and the bar-button text actions Skip, Cancel, Reset and Add (padded to 12 px and offset so the optical edge is unchanged).

Two documented exceptions: the inline "Capability legend" link inside the prototype banner is prose rather than a control, and the state-screen "Exit" buttons are prototype scaffolding at 30 px. Neither is product UI.

Shadows appear twice in the entire prototype: the device frame, and map pins. Everywhere else hierarchy comes from border and surface contrast, per the design system.

## Components

### Verdict card

The product's centre. Carries, in fixed order: condition label, best window, mountain name, place and travel context, primary reason in one or two sentences, main risk in a `--warning-soft` block, and a confidence row. Always routes to evidence.

The score circle from step 2 is deliberately gone. A 62 px ring reading `82/100` implied a calibrated instrument, and the data matrix says no such instrument exists. The qualitative label now leads and confidence is expressed in three steps.

### Confidence indicator

Word plus a three-segment bar, always together, with an `aria-label` naming both. High, Moderate, Low, or "Lowered — stale". No percentage is ever shown. Segments fill with `--brand`, or `--warning` when confidence is reduced by data age.

Confidence drops one step for each missing required input, and to one segment when data is stale. What lowered it is always stated in the evidence expand.

### Condition label

A pill, four variants:

| Variant | Fill | Text | Meaning |
| --- | --- | --- | --- |
| Very good | `--brand` solid | `--on-brand` | Best available |
| Good | `--brand-soft` | `--brand-strong` | Worth the trip |
| Fair | `--seg-bg` | `--text-soft` | Skiable, with compromises |
| Rain risk / caution | `--warning-soft` | `--warning` | A named problem |
| Not enough data | `--seg-bg` | `--text-faint` | Inputs missing; nothing inferred |

### Resort summary

Rank badge where ranked, name, region and travel context, condition pill, then exactly three decision metrics above a divider. An optional one-line qualifier explains a compromise or an unknown. The whole card is the target; no nested controls.

### Constraint chip strip

Horizontally scrolling row of the active preferences shaping the current ranking. Each chip is tappable to loosen. Loosening the drive limit re-ranks live and states the change: what moved to first, its real drive time, and what it displaced. The previous leader dims rather than disappearing, so the comparison stays legible.

This is the mechanism that makes preferences visible rather than merely claimed.

### Segmented control

2–4 mutually exclusive options in a `--seg-bg` trough. Selected option takes `--surface`, full text colour, weight 750 and a 1 px shadow; `aria-selected` is set on every option. Minimum 44 px option height. Used for day, map/list, elevation, units and appearance.

### Evidence disclosure

Collapsed by default, inline, in one fixed order:

1. Deterministic inputs as label–value pairs, including inputs that are missing
2. Which of the nine preferences matched, and which could not be checked
3. The written explanation, in a `--brand-soft` block, with a note stating it may only restate the signals above

The explanation is last and visually subordinate on purpose. The recommendation must be readable and defensible without it.

### Source and freshness block

Appears at the foot of every data-bearing screen, and as chips near the content it qualifies on resort detail. Always separates weather from operations, always states forecast versus observation, always gives a retrieval time, and always names what is illustrative.

### Best-time timeline

Five labelled time buckets, bar height on a common relative scale, each bar carrying a word. A footnote states the height is a relative index and not a measured value. The whole strip has a text `aria-label` describing the sequence.

### Operations block

Dashed border when nothing is reported, three fields reading "Unknown", and a sentence saying explicitly that this is not a closure. This is the single most important component in the set for the "unknown is not zero" rule.

### Map placeholder

Diagonal-striped ground with a monospace `MAP PLACEHOLDER · NO REAL GEOMETRY` mark, region labels, condition-labelled pins, and a legend stating pins are labelled by condition rather than colour. Radar is an overlay with pause, frame position, a static alternative and a note that no provider is selected. A ranked list alternative always exists.

### Switch

52 × 44 target, 48 × 28 track, 22 px knob, 180 ms transition. `role="switch"` with `aria-checked`. The unavailable operations alert uses `aria-disabled` at 60 percent opacity with its reason in place of a value, rather than being hidden.

### Interface state header

Dashed row carrying a monospace state name and an exit. Prototype scaffolding, not product UI — it exists so a reviewer always knows which state they are looking at.

## Motion

- 190 ms screen entry: 6 px rise plus fade
- 180 ms selection, switch and disclosure feedback
- Radar playback is user-controlled and never autoloops
- `prefers-reduced-motion: reduce` collapses every animation and transition to 0.01 ms, and screen entry is skipped rather than shortened

## Accessibility

- Every interactive element has a visible 3 px `--focus` ring at 2 px offset. No browser default ring survives.
- Native roles and state throughout: `role="tablist"`/`tab` with `aria-selected`, `role="radiogroup"`/`radio` with `aria-checked`, `role="switch"` with `aria-checked`, `aria-expanded` on disclosures, `aria-current="page"` on the active tab, `aria-pressed` on toggles.
- Charts and maps carry descriptive `aria-label`s and have list alternatives.
- Decorative marks are `aria-hidden`.
- Toasts live in a `role="status"` `aria-live="polite"` region.
- Icons are geometric strokes at 21 px paired with text labels; the tab bar never relies on the glyph alone.

## Voice

Short, observable, and never anthropomorphic. Written as a person who has skied there would say it.

Used here:

- "Coldest overnight air of any mountain inside your limit."
- "Summit wind builds after noon; gusts to 29 mph."
- "This is not a closure — we have no information either way."
- "Best conditions in range of a weekend, not a day trip."
- "A fabricated rating here would be worse than none."

Avoided: hype, guarantees, certainty without evidence, and any framing that gives the explanation layer a personality or an opinion of its own.
