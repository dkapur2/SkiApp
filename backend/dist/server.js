"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const resorts_1 = require("./data/resorts");
const openMeteo_1 = require("./services/openMeteo");
const skiApi_1 = require("./services/skiApi");
const ai_1 = require("./services/ai");
const app = (0, express_1.default)();
// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express_1.default.json());
app.use((0, cors_1.default)({
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
    res.json((0, openMeteo_1.getAllResortMetadata)());
});
/** Full conditions for one resort: Open-Meteo weather + Ski API data when available. */
app.get('/resorts/:resortId/conditions', async (req, res) => {
    const resort = resorts_1.RESORTS_BY_ID.get(req.params.resortId);
    if (!resort) {
        res.status(404).json({ detail: `Resort '${req.params.resortId}' not found` });
        return;
    }
    try {
        // Fetch weather and Ski API concurrently; Ski API failure never blocks weather data
        const [conditions, skiData] = await Promise.all([
            (0, openMeteo_1.fetchResortConditions)(resort),
            (0, skiApi_1.fetchSkiApiData)(resort.id).catch(() => null),
        ]);
        res.json({ ...conditions, ski_conditions: skiData });
    }
    catch (e) {
        console.error(`[conditions] ${resort.id}:`, e);
        res.status(502).json({ detail: String(e) });
    }
});
/** AI recommendation, optionally enriched with Ski API signals. */
app.post('/recommend', async (req, res) => {
    const body = req.body;
    if (!body?.resort_name) {
        res.status(400).json({ detail: 'resort_name is required' });
        return;
    }
    try {
        // Look up cached Ski API data using resort_id when provided
        const skiData = body.resort_id
            ? await (0, skiApi_1.fetchSkiApiData)(body.resort_id).catch(() => null)
            : null;
        const recommendation = await (0, ai_1.getRecommendation)(body, skiData);
        res.json({ recommendation });
    }
    catch (e) {
        console.error('[recommend]', e);
        const status = String(e).includes('ANTHROPIC_API_KEY') ? 500 : 502;
        res.status(status).json({ detail: String(e) });
    }
});
// ── Static frontend ───────────────────────────────────────────────────────────
// __dirname is backend/dist/ after tsc, so ../../frontend resolves to project root/frontend
const frontendDir = path_1.default.join(__dirname, '..', '..', 'frontend');
app.use(express_1.default.static(frontendDir));
// Fallback: serve index.html for any unmatched GET (SPA support)
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(frontendDir, 'index.html'));
});
// ── Startup ───────────────────────────────────────────────────────────────────
const port = parseInt(process.env.PORT ?? '8000', 10);
app.listen(port, '0.0.0.0', () => {
    console.log(`Ski app listening on port ${port}`);
    // Warm the Open-Meteo cache in the background — one resort every 2 s
    (0, openMeteo_1.warmCache)().catch(console.error);
});
