import express from 'express';
import cors from 'cors';
import path from 'path';

import { RESORTS_BY_ID } from './data/resorts';
import { fetchResortConditions, getAllResortMetadata, warmCache } from './services/openMeteo';
import { fetchSkiApiData } from './services/skiApi';
import { getRecommendation } from './services/ai';
import type { RecommendRequest } from './types';

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json());

app.use(cors({
  origin: [
    'https://dkapur.com',
    'https://www.dkapur.com',
    /^https:\/\/.*\.vercel\.app$/,
  ],
  methods: ['GET', 'POST'],
}));

// ── API routes ────────────────────────────────────────────────────────────────

/** List all resorts with their metadata (name, state, elevations, coordinates). */
app.get('/resorts/conditions', (_req, res) => {
  res.json(getAllResortMetadata());
});

/** Full conditions for one resort: Open-Meteo weather + Ski API data when available. */
app.get('/resorts/:resortId/conditions', async (req, res) => {
  const resort = RESORTS_BY_ID.get(req.params.resortId);
  if (!resort) {
    res.status(404).json({ detail: `Resort '${req.params.resortId}' not found` });
    return;
  }

  try {
    // Fetch weather and Ski API concurrently; Ski API failure never blocks weather data
    const [conditions, skiData] = await Promise.all([
      fetchResortConditions(resort),
      fetchSkiApiData(resort.id).catch(() => null),
    ]);

    res.json({ ...conditions, ski_conditions: skiData });
  } catch (e) {
    console.error(`[conditions] ${resort.id}:`, e);
    res.status(502).json({ detail: String(e) });
  }
});

/** AI recommendation, optionally enriched with Ski API signals. */
app.post('/recommend', async (req, res) => {
  const body = req.body as RecommendRequest;

  if (!body?.resort_name) {
    res.status(400).json({ detail: 'resort_name is required' });
    return;
  }

  try {
    // Look up cached Ski API data using resort_id when provided
    const skiData = body.resort_id
      ? await fetchSkiApiData(body.resort_id).catch(() => null)
      : null;

    const recommendation = await getRecommendation(body, skiData);
    res.json({ recommendation });
  } catch (e) {
    console.error('[recommend]', e);
    const status = String(e).includes('ANTHROPIC_API_KEY') ? 500 : 502;
    res.status(status).json({ detail: String(e) });
  }
});

// ── Static frontend ───────────────────────────────────────────────────────────

// __dirname is backend/dist/ after tsc, so ../../frontend resolves to project root/frontend
const frontendDir = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendDir));

// Fallback: serve index.html for any unmatched GET (SPA support)
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// ── Startup ───────────────────────────────────────────────────────────────────

const port = parseInt(process.env.PORT ?? '8000', 10);

app.listen(port, '0.0.0.0', () => {
  console.log(`Ski app listening on port ${port}`);

  // Warm the Open-Meteo cache in the background — one resort every 2 s
  warmCache().catch(console.error);
});
