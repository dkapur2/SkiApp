import type { Resort } from '../types';

// Separate from the ski catalog used by mobile and startup warming.
// NPS lists Old Rag's summit at 3,291 ft; see docs/old-rag-hiking.md.
// All three internal elevation slots refer to the same summit weather point.
// The hiking client displays only the summit, not invented trail elevations.
const summitMetres = 3291 / 3.28084;

export const HIKING_DESTINATIONS: Resort[] = [{
  id: 'old-rag',
  name: 'Old Rag',
  state: 'VA',
  latitude: 38.5518,
  longitude: -78.3142,
  base_elevation: summitMetres,
  mid_elevation: summitMetres,
  peak_elevation: summitMetres,
}];

export const HIKING_BY_ID = new Map(HIKING_DESTINATIONS.map(destination => [destination.id, destination]));
