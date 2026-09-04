# Step 2 mobile design system

## Direction

The visual language is **calm alpine utility**: quiet snow surfaces, deep spruce accents, crisp typography, and restrained condition colors. The interface should feel trustworthy in a parking lot at 6 AM, not like a dense meteorology terminal or a generic glassmorphism dashboard.

The system uses native platform typography and interaction patterns so the eventual Expo application can feel at home on iOS without copying Apple screens.

## Semantic color tokens

| Token | Light foundation | Dark foundation | Use |
| --- | --- | --- | --- |
| Canvas | `#DFE7E8` | `#071216` | Browser/device surround |
| App background | `#F4F7F6` | `#0B171B` | Main page background |
| Surface | `#FFFFFF` | `#102126` | Cards and controls |
| Raised surface | `#F8FAF9` | `#14272C` | Secondary elevation |
| Primary text | `#102329` | `#EDF6F4` | Titles and values |
| Secondary text | `#52666B` | `#A8BAB9` | Explanations and labels |
| Faint text | `#7A8E92` | `#71888A` | Metadata only |
| Border | `#DCE5E4` | `#23373B` | Dividers and control boundaries |
| Brand | `#116B68` | `#67C7BD` | Primary action and positive selection |
| Brand soft | `#D7EFEB` | `#173D3B` | Selected backgrounds |
| Warning | `#A4562A` | `#F2A675` | Meaningful caution, never decorative emphasis |

Final implementation must test actual contrast combinations rather than assuming token-level compliance. Condition state may not rely on hue alone; pair it with text such as Good, Fair, Windy, or Mixed.

## Typography

- Family: system UI (`SF Pro` on iOS; platform fallback elsewhere)
- Display: 34–40 pt, weight 750–850, tight tracking
- Screen title: 28–34 pt, weight 750–800
- Section title: 18–20 pt, weight 700–750
- Body: 15–17 pt with at least 1.4 line height
- Supporting: 12–14 pt
- Metadata: 11–12 pt; never use metadata sizing for essential decisions
- Numeric values use tabular figures when columns or comparisons require alignment

The mobile implementation must support Dynamic Type. Layouts should grow vertically rather than truncate condition explanations.

## Spacing and shape

- Base spacing unit: 4 pt
- Common spacing: 8, 12, 16, 20, 24, and 32 pt
- Minimum interactive target: 44 by 44 pt
- Control radius: 10–14 pt
- Card radius: 16 pt
- Emphasis-card radius: 24 pt
- Pills are reserved for compact state, filters, and status—not general containers
- Shadows are subtle and rare; border and surface contrast carry most hierarchy

## Core components

### Verdict card

Contains one condition label, best time, resort or action title, a one-sentence explanation, score or confidence, and at most three supporting signals. It must include a route to methodology or detailed evidence.

### Resort summary

Shows resort, region or travel context, qualitative rating, and three decision metrics. The entire card may open resort detail. Avoid small nested controls inside the card.

### Segmented control

Used for a small mutually exclusive set such as forecast day, map/list, or elevation. It must expose selected state programmatically and remain usable with large text.

### Condition score

A score is secondary to the qualitative label. It must not imply more precision than the model supports. If confidence or required inputs are missing, show “Not enough data” rather than a fabricated number.

### Forecast detail

Default to a compact daily signal. Hourly data and the full metric set expand on demand. Wide tables that require horizontal scrolling are not the default mobile representation.

### Source and freshness

Display near the content it qualifies: updated time, provider class, forecast/observation status, and partial-data state. Full attribution and methodology may live in an expanded sheet.

## Navigation

- Three persistent destinations: Today, Explore, Saved
- Preferences live behind the profile control
- Resort detail is pushed from any destination and preserves the return context
- Radar is a map layer
- Compare is an Explore/Today action
- Alerts are configured within Saved and resort detail

## Data visualization

- Prefer annotated signal strips, compact bars, and small trend lines over gauges and dense tables
- Always label axes, units, forecast times, and elevation
- Use a common scale when comparing resorts
- Pair precipitation type with text or icon; do not depend on blue versus green alone
- Deemphasize long-range forecasts as uncertainty increases
- Radar animation must offer pause, time controls, and a nonanimated alternative

## Motion

- 150–220 ms for selection and screen-transition feedback
- Motion explains hierarchy; it does not decorate routine loading
- Respect reduced-motion preference
- Radar playback is user-controlled and must not autoplay indefinitely

## Accessibility baseline

- WCAG AA contrast for text and meaningful controls
- 44-point interactive targets
- Visible keyboard focus on web and clear VoiceOver labels on mobile
- Native roles and state for tabs, switches, disclosures, and navigation
- No essential information communicated only through color, position, or animation
- Content remains understandable at 200 percent text size
- Charts and maps expose a ranked-list alternative
- Location permission denial leaves the manual-origin flow fully functional

## Voice

Use short, observable statements:

- “Go early; winds rise after 1 PM.”
- “Firm first chair, then packed powder.”
- “Operations data unavailable; weather is current.”

Avoid hype, certainty without evidence, and anthropomorphic AI framing:

- Avoid “Epic powder guaranteed.”
- Avoid “Our AI knows the perfect mountain.”
- Avoid presenting a 16-day value as a reliable trip recommendation.
