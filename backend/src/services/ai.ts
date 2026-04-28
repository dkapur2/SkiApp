import Anthropic from '@anthropic-ai/sdk';
import type { RecommendRequest, SkiApiData } from '../types';

const SYSTEM_PROMPT =
  'You are a ski resort advisor. Given current conditions at a resort, ' +
  'provide a concise 2-3 sentence recommendation on whether the resort ' +
  'is worth visiting and why. Be direct and practical.';

/**
 * Build the user message text from the request + optional Ski API data.
 * Ski API signals are appended when available so the model has richer context.
 */
function buildUserMessage(req: RecommendRequest, skiData: SkiApiData | null): string {
  const parts: string[] = [`Resort: ${req.resort_name}`];

  // ── Open-Meteo signals ────────────────────────────────────────────────────
  if (req.snow_depth_in !== null && req.snow_depth_in !== undefined) {
    parts.push(`Snow depth: ${req.snow_depth_in} inches`);
  }
  if (req.temperature_f !== null && req.temperature_f !== undefined) {
    parts.push(`Temperature: ${req.temperature_f}°F`);
  }
  if (req.wind_speed_mph !== null && req.wind_speed_mph !== undefined) {
    parts.push(`Wind speed: ${req.wind_speed_mph} mph`);
  }
  if (req.crowd_level) {
    parts.push(`Crowd level: ${req.crowd_level}`);
  }

  // ── Ski API signals (free-tier enrichment) ────────────────────────────────
  if (skiData) {
    const { snow, lifts } = skiData;

    if (snow) {
      if (snow.conditions) {
        parts.push(`Snow surface: ${snow.conditions}`);
      }
      if (snow.new_snow_48h_in !== null) {
        parts.push(`New snow (48 h): ${snow.new_snow_48h_in} inches`);
      }
      if (snow.new_snow_24h_in !== null) {
        parts.push(`New snow (24 h): ${snow.new_snow_24h_in} inches`);
      }
      if (snow.snow_depth_summit_in !== null) {
        parts.push(`Summit snow depth: ${snow.snow_depth_summit_in} inches`);
      }
      if (snow.snow_depth_base_in !== null) {
        parts.push(`Base snow depth: ${snow.snow_depth_base_in} inches`);
      }
    }

    if (lifts) {
      if (lifts.resort_status) {
        parts.push(`Resort status: ${lifts.resort_status}`);
      }
      if (lifts.lifts_open !== null && lifts.lifts_total !== null) {
        parts.push(`Lifts: ${lifts.lifts_open} of ${lifts.lifts_total} open`);
      }
      if (lifts.runs_open !== null && lifts.runs_total !== null) {
        parts.push(`Runs: ${lifts.runs_open} of ${lifts.runs_total} open`);
      }
    }
  }

  return parts.join('\n');
}

/**
 * Generate an AI recommendation for a resort.
 * Throws if the Anthropic API key is not configured or the call fails.
 */
export async function getRecommendation(
  req: RecommendRequest,
  skiData: SkiApiData | null,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey });
  const userMessage = buildUserMessage(req, skiData);

  const message = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: userMessage }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic API');
  return block.text;
}
