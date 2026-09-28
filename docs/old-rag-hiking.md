# Old Rag in the web hiking menu

The web search dropdown has a **Hiking** group containing **Old Rag**, separate
from the ski resort state groups. Search by `Old Rag` or `hiking`, then select it
to see summit hourly and daily weather, with the existing provider attribution
and fetch/model-run freshness. The ski-specific AI advisor is omitted for hiking.

The [NPS Old Rag map](https://www.nps.gov/shen/planyourvisit/upload/OldRag_RoadTrail.pdf)
lists the summit at **3,291 ft**. The approximate summit weather point is
**38.5518, −78.3142** (the [Old Rag geographic feature](https://www.topozone.com/virginia/madison-va/summit/old-rag-mountain/),
rounded to four decimals). This is a forecast point, not a trailhead or navigation
coordinate. [NPS hiking information](https://www.nps.gov/places/old-rag.htm) is
linked from the forecast for current access and trail information. Sources
checked September 27, 2026.

`GET /hiking/conditions` lists hiking metadata; `GET /hiking/old-rag/conditions`
uses the existing server-side Open-Meteo weather service and response structure.
Internally, base/mid/peak all refer to the same summit point for compatibility
with that service. Only **Summit** is displayed; no trailhead or intermediate
elevations are invented. The existing temperature elevation adjustment,
precipitation approximation, units, null handling and weather metadata apply.
These are weather-model estimates, not trail or rock-surface observations.

The `/resorts/conditions` catalog remains the same 158 ski resorts, including
for mobile. Hiking data is loaded only by the web client. The hiking route never
calls the optional ski operations provider, and it is excluded from the existing
startup resort warming loop. No new provider, collection job, storage, model
integration or client dependency is introduced. Open-Meteo's existing
non-commercial evaluation authorization and commercial launch requirements apply.

Regression coverage exercises separate catalogs, JSON 404s, provider failure,
summit requests, null/zero values, rendered grouping/search, selection, freshness,
and returning to the ski controls. For staging acceptance, verify `/health`, the
158-resort catalog, the hiking catalog/forecast, and select **Hiking → Old Rag** in
the browser; confirm Summit weather and attribution, then load a ski resort.

## Implementation checks — September 27, 2026

- Node 20.20.2 backend check: lint, strict types, 71 network-free tests and build passed.
- Node 20.20.2 mobile check: lint, types, 11 tests and Android/iOS/web exports passed;
  no mobile source, Expo version or dependency changes.
- Production dependency audits: backend zero findings; mobile 13 moderate, zero
  high/critical, in the previously reviewed `decode-uri-component` and `uuid`
  chains. No forced dependency changes were applied.
- Local Chrome acceptance passed with actual provider responses: health, 158
  unique ski resorts, separate Old Rag catalog, JSON 404s, static routes,
  rendered Hiking search/selection, 12 hourly cards, 16 daily rows, linked
  attribution/freshness, return to ski elevation controls, and a 390px web layout.
  Browser assertions reported no page errors. Synthetic null/zero and provider
  failures are covered separately by the network-free regression suite.
