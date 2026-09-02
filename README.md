# SkiTheEast

SkiTheEast is an early-stage ski conditions product maintained in the `SkiApp` repository. The current web application combines elevation-aware forecasts, resort metadata, optional lift and snow-status data, and a short AI-generated recommendation.

The next product phases are a clean map-first mobile experience, radar and forecast layers, and spatial resort discovery with PostgreSQL/PostGIS. Those phases are intentionally not part of this repository-quality milestone.

## Current architecture

```text
Browser
   |
   v
Express API on Railway
   |-- static frontend/index.html
   |-- Open-Meteo forecast adapter
   |-- optional RapidAPI ski adapter
   `-- optional Anthropic recommendation adapter
```

- Runtime: Node.js 20 and TypeScript
- API: Express
- Frontend: static HTML, CSS, and JavaScript served by Express
- Deployment: Docker on Railway
- Cache: process-local, 30-minute TTL

The Python files under `backend/` are from the previous implementation and are not used by the Docker image.

## Local setup

Requirements: Node.js 20 and npm.

```bash
nvm use
cd backend
npm ci
npm run dev
```

Open <http://localhost:8000>. The resort catalog and Open-Meteo conditions work without private keys. Copy `.env.example` to `.env` and load those values in your shell or local environment when testing optional providers. Never commit `.env`.

## Quality checks

From `backend/`:

```bash
npm run check
npm audit --omit=dev
```

`npm run check` runs ESLint, strict TypeScript checks, six network-free tests, and a production TypeScript build. GitHub Actions runs the same quality gate on Node 20.

## API

- `GET /health` — provider-free liveness response
- `GET /resorts/conditions` — local resort metadata
- `GET /resorts/:resortId/conditions` — forecast and optional ski-status data
- `POST /recommend` — optional Anthropic recommendation

Railway uses `/health` for deployment health checks, so a provider outage does not make a healthy API deployment appear dead.

## Documentation

- [Codex setup](docs/CODEX_SETUP.md)
- [Architecture decision 0001](docs/architecture/0001-stabilize-current-stack.md)
- [Step 2 mobile product definition](docs/product/step-2-mobile-product.md)
- [Step 2 data capability matrix](docs/product/step-2-data-capability-matrix.md)
- [Step 2 design system](docs/design/step-2-design-system.md)
- [Step 2 clickable prototype](design/step-2/README.md)
- [Repository instructions](AGENTS.md)
