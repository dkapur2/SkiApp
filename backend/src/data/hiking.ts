import type { HikingDestination } from '../types';

// Separate from the ski catalog used by mobile and startup warming.
// NPS Ridge Trail / Old Rag Summit points, with USGS 1 m DEM elevations.
// Mid is within 1 m vertically of half the trailhead-to-viewpoint rise.
// These are approximate weather points, not surveyed navigation waypoints.
// Source IDs, terrain samples and the distinction from peak height are documented
// in docs/old-rag-hiking.md. Provider requests use each point independently.
const weatherPoints: HikingDestination['weather_points'] = {
  base: {
    label: 'Ridge Trail start by the main parking area',
    latitude: 38.57162186, longitude: -78.29415182, elevation: 284.5,
  },
  mid: {
    label: 'Ridge Trail near half the vertical ascent',
    latitude: 38.55877199, longitude: -78.30137686, elevation: 640.3,
  },
  peak: {
    label: 'NPS Old Rag Summit viewpoint',
    latitude: 38.55171256, longitude: -78.31460513, elevation: 997.2,
  },
};

export const HIKING_DESTINATIONS: HikingDestination[] = [{
  id: 'old-rag',
  name: 'Old Rag',
  state: 'VA',
  latitude: weatherPoints.peak.latitude,
  longitude: weatherPoints.peak.longitude,
  base_elevation: weatherPoints.base.elevation,
  mid_elevation: weatherPoints.mid.elevation,
  peak_elevation: weatherPoints.peak.elevation,
  weather_points: weatherPoints,
}];

export const HIKING_BY_ID = new Map(HIKING_DESTINATIONS.map(destination => [destination.id, destination]));
