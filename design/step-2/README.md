# Step 2 mobile product prototype

This directory contains a local-only, clickable product prototype for SkiApp's mobile experience. It is deliberately outside `frontend/`, so the Docker image and Railway deployments do not serve it.

## Open it

Open `index.html` directly in a browser, or serve this directory locally:

```bash
python3 -m http.server 4173 --directory design/step-2
```

Then visit <http://127.0.0.1:4173>.

## What is interactive

- Today, Explore, and Saved bottom navigation
- Resort cards and map pins opening the resort-detail concept
- Map/list switching and filter chips
- Forecast-window and elevation segmented controls
- Saving a resort and enabling/disabling alert concepts
- Light and dark appearance switching
- Expandable recommendation explanation

## Important limitation

All condition scores, surface descriptions, travel times, alerts, dates, resort operations, and recommendation text are illustrative. They define the intended product experience; they are not claims about current conditions and are not all supported by the current API.

The implementation boundary is documented in:

- [`docs/product/step-2-mobile-product.md`](../../docs/product/step-2-mobile-product.md)
- [`docs/product/step-2-data-capability-matrix.md`](../../docs/product/step-2-data-capability-matrix.md)
- [`docs/design/step-2-design-system.md`](../../docs/design/step-2-design-system.md)
