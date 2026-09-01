# SkiApp repository guidance

## Project shape

- `frontend/index.html` is the current static web client.
- `backend/src/` is the active TypeScript/Express API.
- `backend/main.py`, `backend/resorts.py`, and `backend/requirements.txt` are legacy reference files and are not part of the deployed runtime.
- `Dockerfile` builds the TypeScript API and serves the static frontend.
- Railway is the current deployment target.
- `memory/` records earlier project decisions; validate it against current source before relying on it.

## Commands

Run backend commands from `backend/` with Node 20:

```bash
npm ci
npm run dev
npm run check
```

`npm run check` must run linting, strict TypeScript checks, network-free tests, and the production build.

## Engineering constraints

- Use TypeScript for new runtime and backend work.
- Keep provider secrets on the server and out of the browser, mobile client, logs, and repository.
- Do not make tests depend on Open-Meteo, RapidAPI, Anthropic, or any other external service.
- Preserve documented API response shapes unless a task explicitly includes a versioned API change.
- Validate request input at the API boundary and return useful HTTP status codes.
- Keep weather providers behind service modules so they can be replaced without rewriting route or client code.
- Do not introduce Expo, PostGIS, persistent caching, or a hosting migration unless the task explicitly includes that phase.
- Do not commit `node_modules`, `dist`, secrets, caches, virtual environments, or OS metadata.
- Keep provider attribution and commercial licensing requirements visible when changing weather data sources.

## Definition of done

- The requested behavior is implemented without unrelated changes.
- Relevant tests are added or updated and do not require network access.
- `cd backend && npm run check` passes on Node 20.
- Production dependency audit findings are reviewed.
- Deployment-affecting changes include an appropriate health check and documentation update.
- The final diff is reviewed for secrets, generated output, and accidental dependency files.
