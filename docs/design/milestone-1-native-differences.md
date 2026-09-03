# Milestone 1 native implementation notes

The Claude Design mobile v2 handoff is preserved under `design/claude-handoff/2026-09-02-mobile-v2/`. This document records intentional differences in the first production slice.

## Intentional scope differences

- The Today screen identifies a user-selected mountain. It does not claim a ranked or personalized recommendation because the current backend has no validated scoring or preference model.
- Only Today and pushed Resort Detail are routable. Explore, Saved, profile, compare, radar, and alerts are not represented by inactive controls or placeholder screens.
- Resort Detail omits the numeric score, qualitative verdict, confidence indicator, surface interpretation, and best-time timeline. The current API cannot substantiate them.
- Appearance follows the operating-system setting. An explicit persisted appearance override belongs to the later settings milestone.
- The five-day display treats the first 72 hours as the decision window and visually de-emphasizes days four and five as outlook.

## Current API constraints

- Weather freshness uses the backend's successful Open-Meteo fetch time and survives process-local cache hits. The provider does not currently expose a reliable model initialization time, so `model_run_at` remains explicitly null and the UI says it was not provided.
- Resort operations use their provider timestamp when returned. A null `ski_conditions` response cannot currently distinguish unconfigured, unsupported, and provider-failure cases, so the UI says only that operations are unavailable and explicitly does not infer closure.
- Backend and mobile contracts keep unknown snow, rain, and cloud-cover measurements nullable. A measured zero remains zero; missing inputs no longer generate synthetic zero precipitation or clear-sky values.
- This milestone corrects the existing Open-Meteo imperial-unit handling for snow depth, visibility, and freezing height. Open-Meteo already returns those fields in feet when `temperature_unit=fahrenheit` is requested, so the backend now converts feet to inches/miles where needed instead of treating the values as meters.
- Stale status describes a server weather fetch older than 30 minutes or a failed refresh while prior data remains available. Persistent offline caching is not included.

## Native-platform choices

- Screens use native scrolling, press, text-input, and accessibility APIs rather than copying HTML or ARIA attributes.
- Every interactive control has a minimum 44-point target. Elevation changes are announced to screen readers.
- No custom animation is required for comprehension, so Reduced Motion users lose no information.
- System fonts replace the prototype's browser font stack and may wrap a few pixels differently at large Dynamic Type sizes.
- The first slice uses stack navigation without displaying nonfunctional future tabs. Persistent three-destination navigation will be added when Explore and Saved become real screens.

## Remaining visual work outside this milestone

- Replace the generated Expo application icon and native launch artwork with approved SkiTheEast brand assets.
- Validate final screenshots on iOS and Android simulators, including 200% Dynamic Type and screen-reader focus order.
- Add the editable Claude Design `.dc.html` source when it becomes available; the supplied archive contains only the exported handoff.
