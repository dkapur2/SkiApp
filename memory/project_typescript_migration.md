---
name: TypeScript backend migration
description: Python/FastAPI backend converted to TypeScript/Express; Ski API integration added
type: project
---

Converted the entire backend from Python/FastAPI to TypeScript/Express (Node.js 20).

**Why:** User constraint "Use TypeScript throughout" for all new work.

**How to apply:** All new backend code must be TypeScript. Python files (main.py, resorts.py, requirements.txt) are dead code now; Dockerfile builds Node.js.

New file structure:
- `backend/src/types.ts` — all shared interfaces
- `backend/src/cache.ts` — generic TTL cache
- `backend/src/data/resorts.ts` — 158 resort definitions (was Python list)
- `backend/src/services/openMeteo.ts` — Open-Meteo fetch + elevation math (port of resorts.py)
- `backend/src/services/skiApi.ts` — NEW: RapidAPI Ski API integration
- `backend/src/services/ai.ts` — Anthropic recommendation (port of main.py)
- `backend/src/server.ts` — Express routes (port of main.py)

Ski API env vars needed: `RAPIDAPI_KEY` (required), `RAPIDAPI_SKI_HOST` (optional, default: ski-resort-forecast.p.rapidapi.com).

API response shape is backward-compatible: added optional `ski_conditions` field to conditions response. Frontend updated to pass `resort_id` in `/recommend` so AI gets Ski API enrichment.
