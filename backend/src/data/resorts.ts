import type { Resort } from '../types';

/** Midpoint helper — mirrors Python's _mid(). Uses floor division for exact parity. */
const mid = (base: number, peak: number): number => Math.floor((base + peak) / 2);

// Elevations stored in meters. Base/peak from official sources; mid computed as midpoint.
export const RESORTS: Resort[] = [
  // ── Pennsylvania ──────────────────────────────────────────────────────────
  {
    id: 'bear-creek', name: 'Bear Creek', state: 'PA',
    latitude: 40.4761, longitude: -75.6258,
    base_elevation: 180, mid_elevation: mid(180, 335), peak_elevation: 335,
  },
  {
    id: 'blue-knob', name: 'Blue Knob', state: 'PA',
    latitude: 40.2880, longitude: -78.5623,
    base_elevation: 632, mid_elevation: mid(632, 967), peak_elevation: 967,
  },
  {
    id: 'blue-mountain', name: 'Blue Mountain', state: 'PA',
    latitude: 40.8167, longitude: -75.5167,
    base_elevation: 140, mid_elevation: mid(140, 488), peak_elevation: 488,
  },
  {
    id: 'boyce-park', name: 'Boyce Park', state: 'PA',
    latitude: 40.3170, longitude: -80.0924,
    base_elevation: 333, mid_elevation: mid(333, 388), peak_elevation: 388,
  },
  {
    id: 'camelback', name: 'Camelback', state: 'PA',
    latitude: 41.0500, longitude: -75.3500,
    base_elevation: 378, mid_elevation: mid(378, 650), peak_elevation: 650,
  },
  {
    id: 'eagle-rock', name: 'Eagle Rock Resort', state: 'PA',
    latitude: 40.7200, longitude: -75.6500,
    base_elevation: 384, mid_elevation: mid(384, 552), peak_elevation: 552,
  },
  {
    id: 'elk-mountain', name: 'Elk Mountain', state: 'PA',
    latitude: 41.7200, longitude: -75.5500,
    base_elevation: 516, mid_elevation: mid(516, 821), peak_elevation: 821,
  },
  {
    id: 'hidden-valley', name: 'Hidden Valley', state: 'PA',
    latitude: 40.1567, longitude: -79.1839,
    base_elevation: 701, mid_elevation: mid(701, 876), peak_elevation: 876,
  },
  {
    id: 'jack-frost-big-boulder', name: 'Jack Frost Big Boulder', state: 'PA',
    latitude: 41.1075, longitude: -75.6531,
    base_elevation: 427, mid_elevation: mid(427, 663), peak_elevation: 663,
  },
  {
    id: 'laurel-mountain', name: 'Laurel Mountain', state: 'PA',
    latitude: 40.1565, longitude: -79.1678,
    base_elevation: 610, mid_elevation: mid(610, 798), peak_elevation: 798,
  },
  {
    id: 'liberty', name: 'Liberty', state: 'PA',
    latitude: 39.7954, longitude: -77.3994,
    base_elevation: 174, mid_elevation: 269, peak_elevation: 363,
  },
  {
    id: 'montage-mountain', name: 'Montage Mountain', state: 'PA',
    latitude: 41.3533, longitude: -75.6592,
    base_elevation: 293, mid_elevation: mid(293, 597), peak_elevation: 597,
  },
  {
    id: 'mount-pleasant', name: 'Mount Pleasant of Edinboro', state: 'PA',
    latitude: 41.8519, longitude: -80.0710,
    base_elevation: 320, mid_elevation: mid(320, 472), peak_elevation: 472,
  },
  {
    id: 'mystic-mountain', name: 'Mystic Mountain at Nemacolin', state: 'PA',
    latitude: 39.8119, longitude: -79.5435,
    base_elevation: 823, mid_elevation: mid(823, 945), peak_elevation: 945,
  },
  {
    id: 'seven-springs', name: 'Seven Springs', state: 'PA',
    latitude: 40.0231, longitude: -79.2928,
    base_elevation: 640, mid_elevation: mid(640, 913), peak_elevation: 913,
  },
  {
    id: 'shawnee-mountain', name: 'Shawnee Mountain', state: 'PA',
    latitude: 41.0300, longitude: -75.0700,
    base_elevation: 198, mid_elevation: mid(198, 411), peak_elevation: 411,
  },
  {
    id: 'ski-big-bear', name: 'Ski Big Bear', state: 'PA',
    latitude: 41.2033, longitude: -75.3300,
    base_elevation: 183, mid_elevation: mid(183, 381), peak_elevation: 381,
  },
  {
    id: 'ski-roundtop', name: 'Ski Roundtop', state: 'PA',
    latitude: 40.1100, longitude: -76.8750,
    base_elevation: 230, mid_elevation: mid(230, 407), peak_elevation: 407,
  },
  {
    id: 'ski-sawmill', name: 'Ski SawMill', state: 'PA',
    latitude: 41.5200, longitude: -77.2900,
    base_elevation: 539, mid_elevation: mid(539, 675), peak_elevation: 675,
  },
  {
    id: 'spring-mountain', name: 'Spring Mountain', state: 'PA',
    latitude: 40.1867, longitude: -75.3750,
    base_elevation: 24, mid_elevation: mid(24, 161), peak_elevation: 161,
  },
  {
    id: 'tussey-mountain', name: 'Tussey Mountain', state: 'PA',
    latitude: 40.7692, longitude: -77.7533,
    base_elevation: 399, mid_elevation: mid(399, 555), peak_elevation: 555,
  },
  {
    id: 'whitetail', name: 'Whitetail', state: 'PA',
    latitude: 39.7360, longitude: -77.8990,
    base_elevation: 264, mid_elevation: 407, peak_elevation: 549,
  },
  // ── Maryland ──────────────────────────────────────────────────────────────
  {
    id: 'wisp', name: 'Wisp Resort', state: 'MD',
    latitude: 39.5569, longitude: -79.3634,
    base_elevation: 736, mid_elevation: mid(736, 949), peak_elevation: 949,
  },
  // ── Virginia ──────────────────────────────────────────────────────────────
  {
    id: 'bryce-resort', name: 'Bryce Resort', state: 'VA',
    latitude: 38.8175, longitude: -78.7660,
    base_elevation: 381, mid_elevation: mid(381, 533), peak_elevation: 533,
  },
  {
    id: 'massanutten', name: 'Massanutten', state: 'VA',
    latitude: 38.4093, longitude: -78.7539,
    base_elevation: 533, mid_elevation: mid(533, 892), peak_elevation: 892,
  },
  {
    id: 'omni-homestead', name: 'The Omni Homestead', state: 'VA',
    latitude: 37.7829, longitude: -79.8283,
    base_elevation: 762, mid_elevation: mid(762, 975), peak_elevation: 975,
  },
  {
    id: 'wintergreen', name: 'Wintergreen Resort', state: 'VA',
    latitude: 37.9142, longitude: -78.9438,
    base_elevation: 766, mid_elevation: mid(766, 1071), peak_elevation: 1071,
  },
  // ── West Virginia ─────────────────────────────────────────────────────────
  {
    id: 'canaan-valley', name: 'Canaan Valley Resort', state: 'WV',
    latitude: 39.0273, longitude: -79.4620,
    base_elevation: 1046, mid_elevation: mid(1046, 1305), peak_elevation: 1305,
  },
  {
    id: 'oglebay', name: 'Oglebay Resort', state: 'WV',
    latitude: 40.0661, longitude: -80.6942,
    base_elevation: 248, mid_elevation: mid(248, 335), peak_elevation: 335,
  },
  {
    id: 'snowshoe', name: 'Snowshoe', state: 'WV',
    latitude: 38.4023, longitude: -79.9939,
    base_elevation: 1020, mid_elevation: 1249, peak_elevation: 1478,
  },
  {
    id: 'timberline', name: 'Timberline Mountain', state: 'WV',
    latitude: 39.1311, longitude: -79.4663,
    base_elevation: 996, mid_elevation: mid(996, 1301), peak_elevation: 1301,
  },
  {
    id: 'winterplace', name: 'Winterplace Ski Resort', state: 'WV',
    latitude: 37.8800, longitude: -81.1200,
    base_elevation: 914, mid_elevation: mid(914, 1097), peak_elevation: 1097,
  },
  // ── North Carolina ────────────────────────────────────────────────────────
  {
    id: 'appalachian-ski-mountain', name: 'Appalachian Ski Mountain', state: 'NC',
    latitude: 36.1750, longitude: -81.6650,
    base_elevation: 1108, mid_elevation: mid(1108, 1219), peak_elevation: 1219,
  },
  {
    id: 'beech-mountain', name: 'Beech Mountain Resort', state: 'NC',
    latitude: 36.1846, longitude: -81.8815,
    base_elevation: 1425, mid_elevation: mid(1425, 1678), peak_elevation: 1678,
  },
  {
    id: 'cataloochee', name: 'Cataloochee Ski Area', state: 'NC',
    latitude: 35.5624, longitude: -83.0900,
    base_elevation: 1420, mid_elevation: mid(1420, 1646), peak_elevation: 1646,
  },
  {
    id: 'hatley-pointe', name: 'Hatley Pointe', state: 'NC',
    latitude: 35.8264, longitude: -82.5496,
    base_elevation: 1219, mid_elevation: mid(1219, 1433), peak_elevation: 1433,
  },
  {
    id: 'sapphire-valley', name: 'Sapphire Valley', state: 'NC',
    latitude: 35.1070, longitude: -83.0029,
    base_elevation: 975, mid_elevation: mid(975, 1052), peak_elevation: 1052,
  },
  {
    id: 'sugar-mountain', name: 'Sugar Mountain Resort', state: 'NC',
    latitude: 36.1246, longitude: -81.8757,
    base_elevation: 1250, mid_elevation: mid(1250, 1615), peak_elevation: 1615,
  },
  // ── Tennessee ─────────────────────────────────────────────────────────────
  {
    id: 'ober-mountain', name: 'Ober Mountain', state: 'TN',
    latitude: 35.7059, longitude: -83.5575,
    base_elevation: 823, mid_elevation: mid(823, 1006), peak_elevation: 1006,
  },
  // ── Vermont ───────────────────────────────────────────────────────────────
  {
    id: 'bolton-valley', name: 'Bolton Valley', state: 'VT',
    latitude: 44.42, longitude: -72.87,
    base_elevation: 640, mid_elevation: mid(640, 960), peak_elevation: 960,
  },
  {
    id: 'brattleboro-ski-hill', name: 'Brattleboro Ski Hill', state: 'VT',
    latitude: 42.86, longitude: -72.54,
    base_elevation: 131, mid_elevation: mid(131, 238), peak_elevation: 238,
  },
  {
    id: 'bromley-mountain', name: 'Bromley Mountain Resort', state: 'VT',
    latitude: 43.22, longitude: -72.94,
    base_elevation: 597, mid_elevation: mid(597, 1001), peak_elevation: 1001,
  },
  {
    id: 'burke-mountain', name: 'Burke Mountain Resort', state: 'VT',
    latitude: 44.60, longitude: -71.90,
    base_elevation: 368, mid_elevation: mid(368, 996), peak_elevation: 996,
  },
  {
    id: 'cochrans-ski-area', name: "Cochran's Ski Area", state: 'VT',
    latitude: 44.40, longitude: -72.99,
    base_elevation: 183, mid_elevation: mid(183, 366), peak_elevation: 366,
  },
  {
    id: 'jay-peak', name: 'Jay Peak', state: 'VT',
    latitude: 44.9256, longitude: -72.5120,
    base_elevation: 533, mid_elevation: 855, peak_elevation: 1177,
  },
  {
    id: 'killington', name: 'Killington', state: 'VT',
    latitude: 43.68, longitude: -72.82,
    base_elevation: 355, mid_elevation: mid(355, 1289), peak_elevation: 1289,
  },
  {
    id: 'lyndon-outing-club', name: 'Lyndon Outing Club', state: 'VT',
    latitude: 44.53, longitude: -72.02,
    base_elevation: 274, mid_elevation: mid(274, 427), peak_elevation: 427,
  },
  {
    id: 'mad-river-glen', name: 'Mad River Glen', state: 'VT',
    latitude: 44.19, longitude: -72.91,
    base_elevation: 488, mid_elevation: mid(488, 1109), peak_elevation: 1109,
  },
  {
    id: 'magic-mountain', name: 'Magic Mountain', state: 'VT',
    latitude: 43.19, longitude: -72.77,
    base_elevation: 411, mid_elevation: mid(411, 871), peak_elevation: 871,
  },
  {
    id: 'middlebury-snowbowl', name: 'Middlebury Snowbowl', state: 'VT',
    latitude: 43.96, longitude: -73.02,
    base_elevation: 380, mid_elevation: mid(380, 795), peak_elevation: 795,
  },
  {
    id: 'mount-snow', name: 'Mount Snow Resort', state: 'VT',
    latitude: 42.97, longitude: -72.92,
    base_elevation: 579, mid_elevation: mid(579, 1097), peak_elevation: 1097,
  },
  {
    id: 'northeast-slopes', name: 'Northeast Slopes', state: 'VT',
    latitude: 44.12, longitude: -72.35,
    base_elevation: 274, mid_elevation: mid(274, 427), peak_elevation: 427,
  },
  {
    id: 'okemo', name: 'Okemo', state: 'VT',
    latitude: 43.40, longitude: -72.73,
    base_elevation: 349, mid_elevation: mid(349, 1019), peak_elevation: 1019,
  },
  {
    id: 'pico-mountain', name: 'Pico Mountain', state: 'VT',
    latitude: 43.67, longitude: -72.85,
    base_elevation: 599, mid_elevation: mid(599, 1209), peak_elevation: 1209,
  },
  {
    id: 'quechee', name: 'Quechee Ski Hill', state: 'VT',
    latitude: 43.64, longitude: -72.42,
    base_elevation: 213, mid_elevation: mid(213, 335), peak_elevation: 335,
  },
  {
    id: 'saskadena-six', name: 'Saskadena Six', state: 'VT',
    latitude: 43.71, longitude: -72.52,
    base_elevation: 290, mid_elevation: mid(290, 427), peak_elevation: 427,
  },
  {
    id: 'smugglers-notch', name: "Smugglers' Notch Resort", state: 'VT',
    latitude: 44.56, longitude: -72.78,
    base_elevation: 314, mid_elevation: mid(314, 1109), peak_elevation: 1109,
  },
  {
    id: 'stowe', name: 'Stowe', state: 'VT',
    latitude: 44.5303, longitude: -72.7814,
    base_elevation: 390, mid_elevation: 1105, peak_elevation: 1340,
  },
  {
    id: 'stratton', name: 'Stratton', state: 'VT',
    latitude: 43.12, longitude: -72.91,
    base_elevation: 570, mid_elevation: mid(570, 1181), peak_elevation: 1181,
  },
  {
    id: 'sugarbush', name: 'Sugarbush', state: 'VT',
    latitude: 44.13, longitude: -72.90,
    base_elevation: 452, mid_elevation: mid(452, 1245), peak_elevation: 1245,
  },
  // ── Maine ─────────────────────────────────────────────────────────────────
  {
    id: 'baker-mountain', name: 'Baker Mountain', state: 'ME',
    latitude: 44.77, longitude: -70.17,
    base_elevation: 250, mid_elevation: mid(250, 399), peak_elevation: 399,
  },
  {
    id: 'bigrock-mountain', name: 'BigRock Mountain', state: 'ME',
    latitude: 46.52, longitude: -67.84,
    base_elevation: 296, mid_elevation: mid(296, 531), peak_elevation: 531,
  },
  {
    id: 'big-squaw-mountain', name: 'Big Squaw Mountain', state: 'ME',
    latitude: 45.47, longitude: -69.63,
    base_elevation: 533, mid_elevation: mid(533, 974), peak_elevation: 974,
  },
  {
    id: 'black-mountain-maine', name: 'Black Mountain of Maine', state: 'ME',
    latitude: 44.56, longitude: -70.56,
    base_elevation: 296, mid_elevation: mid(296, 727), peak_elevation: 727,
  },
  {
    id: 'camden-snow-bowl', name: 'Camden Snow Bowl', state: 'ME',
    latitude: 44.21, longitude: -69.09,
    base_elevation: 107, mid_elevation: mid(107, 396), peak_elevation: 396,
  },
  {
    id: 'hermon-mountain', name: 'Hermon Mountain', state: 'ME',
    latitude: 44.81, longitude: -68.90,
    base_elevation: 30, mid_elevation: mid(30, 137), peak_elevation: 137,
  },
  {
    id: 'lonesome-pine-trails', name: 'Lonesome Pine Trails', state: 'ME',
    latitude: 47.25, longitude: -68.59,
    base_elevation: 174, mid_elevation: mid(174, 299), peak_elevation: 299,
  },
  {
    id: 'lost-valley', name: 'Lost Valley', state: 'ME',
    latitude: 44.09, longitude: -70.29,
    base_elevation: 78, mid_elevation: mid(78, 151), peak_elevation: 151,
  },
  {
    id: 'mt-abram', name: 'Mt. Abram Ski Resort', state: 'ME',
    latitude: 44.37, longitude: -70.70,
    base_elevation: 299, mid_elevation: mid(299, 608), peak_elevation: 608,
  },
  {
    id: 'powderhouse-hill', name: 'Powderhouse Hill', state: 'ME',
    latitude: 44.36, longitude: -69.52,
    base_elevation: 91, mid_elevation: mid(91, 152), peak_elevation: 152,
  },
  {
    id: 'quoggy-jo', name: 'Quoggy Jo Ski Center', state: 'ME',
    latitude: 46.71, longitude: -68.04,
    base_elevation: 217, mid_elevation: mid(217, 275), peak_elevation: 275,
  },
  {
    id: 'saddleback', name: 'Saddleback', state: 'ME',
    latitude: 44.84, longitude: -70.59,
    base_elevation: 752, mid_elevation: mid(752, 1256), peak_elevation: 1256,
  },
  {
    id: 'pleasant-mountain', name: 'Pleasant Mountain', state: 'ME',
    latitude: 44.04, longitude: -70.76,
    base_elevation: 137, mid_elevation: mid(137, 611), peak_elevation: 611,
  },
  {
    id: 'spruce-mountain', name: 'Spruce Mountain', state: 'ME',
    latitude: 44.47, longitude: -70.35,
    base_elevation: 198, mid_elevation: mid(198, 451), peak_elevation: 451,
  },
  {
    id: 'sugarloaf', name: 'Sugarloaf', state: 'ME',
    latitude: 45.03, longitude: -70.31,
    base_elevation: 432, mid_elevation: mid(432, 1291), peak_elevation: 1291,
  },
  {
    id: 'sunday-river', name: 'Sunday River', state: 'ME',
    latitude: 44.47, longitude: -70.86,
    base_elevation: 244, mid_elevation: mid(244, 957), peak_elevation: 957,
  },
  {
    id: 'titcomb-mountain', name: 'Titcomb Mountain', state: 'ME',
    latitude: 44.67, longitude: -70.15,
    base_elevation: 244, mid_elevation: mid(244, 451), peak_elevation: 451,
  },
  // ── New Hampshire ─────────────────────────────────────────────────────────
  {
    id: 'abenaki-ski-area', name: 'Abenaki Ski Area', state: 'NH',
    latitude: 43.59, longitude: -71.20,
    base_elevation: 213, mid_elevation: mid(213, 427), peak_elevation: 427,
  },
  {
    id: 'arrowhead-ski-area', name: 'Arrowhead Ski Area', state: 'NH',
    latitude: 43.30, longitude: -71.88,
    base_elevation: 183, mid_elevation: mid(183, 396), peak_elevation: 396,
  },
  {
    id: 'attitash-mountain', name: 'Attitash Mountain', state: 'NH',
    latitude: 44.09, longitude: -71.21,
    base_elevation: 183, mid_elevation: mid(183, 716), peak_elevation: 716,
  },
  {
    id: 'black-mountain-nh', name: 'Black Mountain', state: 'NH',
    latitude: 44.17, longitude: -71.17,
    base_elevation: 335, mid_elevation: mid(335, 840), peak_elevation: 840,
  },
  {
    id: 'bretton-woods', name: 'Bretton Woods', state: 'NH',
    latitude: 44.26, longitude: -71.45,
    base_elevation: 498, mid_elevation: mid(498, 945), peak_elevation: 945,
  },
  {
    id: 'cannon-mountain', name: 'Cannon Mountain', state: 'NH',
    latitude: 44.16, longitude: -71.70,
    base_elevation: 584, mid_elevation: mid(584, 1244), peak_elevation: 1244,
  },
  {
    id: 'cranmore-mountain', name: 'Cranmore Mountain Resort', state: 'NH',
    latitude: 44.05, longitude: -71.10,
    base_elevation: 293, mid_elevation: mid(293, 628), peak_elevation: 628,
  },
  {
    id: 'crotched-mountain', name: 'Crotched Mountain', state: 'NH',
    latitude: 43.17, longitude: -71.95,
    base_elevation: 320, mid_elevation: mid(320, 630), peak_elevation: 630,
  },
  {
    id: 'dartmouth-skiway', name: 'Dartmouth Skiway', state: 'NH',
    latitude: 43.89, longitude: -72.21,
    base_elevation: 295, mid_elevation: mid(295, 592), peak_elevation: 592,
  },
  {
    id: 'granite-gorge', name: 'Granite Gorge Mountain Park', state: 'NH',
    latitude: 42.97, longitude: -72.18,
    base_elevation: 274, mid_elevation: mid(274, 500), peak_elevation: 500,
  },
  {
    id: 'gunstock-mountain', name: 'Gunstock Mountain Resort', state: 'NH',
    latitude: 43.54, longitude: -71.37,
    base_elevation: 325, mid_elevation: mid(325, 684), peak_elevation: 684,
  },
  {
    id: 'king-pine', name: 'King Pine', state: 'NH',
    latitude: 43.87, longitude: -71.13,
    base_elevation: 244, mid_elevation: mid(244, 457), peak_elevation: 457,
  },
  {
    id: 'loon-mountain', name: 'Loon Mountain Resort', state: 'NH',
    latitude: 44.04, longitude: -71.62,
    base_elevation: 272, mid_elevation: mid(272, 930), peak_elevation: 930,
  },
  {
    id: 'mcintyre-ski-area', name: 'McIntyre Ski Area', state: 'NH',
    latitude: 43.00, longitude: -71.53,
    base_elevation: 152, mid_elevation: mid(152, 335), peak_elevation: 335,
  },
  {
    id: 'mount-sunapee', name: 'Mount Sunapee', state: 'NH',
    latitude: 43.35, longitude: -72.07,
    base_elevation: 376, mid_elevation: mid(376, 836), peak_elevation: 836,
  },
  {
    id: 'pats-peak', name: 'Pats Peak', state: 'NH',
    latitude: 43.19, longitude: -71.80,
    base_elevation: 210, mid_elevation: mid(210, 445), peak_elevation: 445,
  },
  {
    id: 'ragged-mountain-nh', name: 'Ragged Mountain Resort', state: 'NH',
    latitude: 43.53, longitude: -71.85,
    base_elevation: 305, mid_elevation: mid(305, 677), peak_elevation: 677,
  },
  {
    id: 'storrs-hill', name: 'Storrs Hill Ski Area', state: 'NH',
    latitude: 43.65, longitude: -72.25,
    base_elevation: 137, mid_elevation: mid(137, 290), peak_elevation: 290,
  },
  {
    id: 'tenney-mountain', name: 'Tenney Mountain', state: 'NH',
    latitude: 43.77, longitude: -71.71,
    base_elevation: 274, mid_elevation: mid(274, 628), peak_elevation: 628,
  },
  {
    id: 'waterville-valley', name: 'Waterville Valley Resort', state: 'NH',
    latitude: 43.97, longitude: -71.52,
    base_elevation: 605, mid_elevation: mid(605, 1220), peak_elevation: 1220,
  },
  {
    id: 'whaleback-mountain', name: 'Whaleback Mountain', state: 'NH',
    latitude: 43.62, longitude: -72.13,
    base_elevation: 183, mid_elevation: mid(183, 332), peak_elevation: 332,
  },
  {
    id: 'wildcat-mountain', name: 'Wildcat Mountain', state: 'NH',
    latitude: 44.26, longitude: -71.23,
    base_elevation: 644, mid_elevation: mid(644, 1238), peak_elevation: 1238,
  },
  // ── Massachusetts ─────────────────────────────────────────────────────────
  {
    id: 'berkshire-east', name: 'Berkshire East', state: 'MA',
    latitude: 42.63, longitude: -72.87,
    base_elevation: 201, mid_elevation: mid(201, 561), peak_elevation: 561,
  },
  {
    id: 'blue-hills-ski-area', name: 'Blue Hills Ski Area', state: 'MA',
    latitude: 42.22, longitude: -71.10,
    base_elevation: 99, mid_elevation: mid(99, 194), peak_elevation: 194,
  },
  {
    id: 'bousquet-ski-area', name: 'Bousquet Ski Area', state: 'MA',
    latitude: 42.43, longitude: -73.28,
    base_elevation: 366, mid_elevation: mid(366, 561), peak_elevation: 561,
  },
  {
    id: 'bradford-ski-area', name: 'Bradford Ski Area', state: 'MA',
    latitude: 42.78, longitude: -71.10,
    base_elevation: 49, mid_elevation: mid(49, 305), peak_elevation: 305,
  },
  {
    id: 'jiminy-peak', name: 'Jiminy Peak', state: 'MA',
    latitude: 42.55, longitude: -73.34,
    base_elevation: 356, mid_elevation: mid(356, 725), peak_elevation: 725,
  },
  {
    id: 'nashoba-valley', name: 'Nashoba Valley', state: 'MA',
    latitude: 42.48, longitude: -71.58,
    base_elevation: 70, mid_elevation: mid(70, 152), peak_elevation: 152,
  },
  {
    id: 'otis-ridge', name: 'Otis Ridge Ski Area', state: 'MA',
    latitude: 42.19, longitude: -73.08,
    base_elevation: 335, mid_elevation: mid(335, 549), peak_elevation: 549,
  },
  {
    id: 'ski-butternut', name: 'Ski Butternut', state: 'MA',
    latitude: 42.19, longitude: -73.37,
    base_elevation: 323, mid_elevation: mid(323, 564), peak_elevation: 564,
  },
  {
    id: 'ski-ward', name: 'Ski Ward', state: 'MA',
    latitude: 42.29, longitude: -71.68,
    base_elevation: 229, mid_elevation: mid(229, 274), peak_elevation: 274,
  },
  {
    id: 'wachusett-mountain', name: 'Wachusett Mountain Ski Area', state: 'MA',
    latitude: 42.50, longitude: -71.89,
    base_elevation: 307, mid_elevation: mid(307, 611), peak_elevation: 611,
  },
  // ── Connecticut ───────────────────────────────────────────────────────────
  {
    id: 'mohawk-mountain', name: 'Mohawk Mountain', state: 'CT',
    latitude: 41.83, longitude: -73.31,
    base_elevation: 195, mid_elevation: mid(195, 488), peak_elevation: 488,
  },
  {
    id: 'mount-southington', name: 'Mount Southington Ski Area', state: 'CT',
    latitude: 41.60, longitude: -72.88,
    base_elevation: 91, mid_elevation: mid(91, 238), peak_elevation: 238,
  },
  {
    id: 'powder-ridge', name: 'Powder Ridge Park', state: 'CT',
    latitude: 41.50, longitude: -72.72,
    base_elevation: 91, mid_elevation: mid(91, 219), peak_elevation: 219,
  },
  {
    id: 'ski-sundown', name: 'Ski Sundown', state: 'CT',
    latitude: 41.88, longitude: -72.95,
    base_elevation: 152, mid_elevation: mid(152, 335), peak_elevation: 335,
  },
  {
    id: 'woodbury-ski-area', name: 'Woodbury Ski Area', state: 'CT',
    latitude: 41.54, longitude: -73.23,
    base_elevation: 183, mid_elevation: mid(183, 262), peak_elevation: 262,
  },
  // ── Rhode Island ──────────────────────────────────────────────────────────
  {
    id: 'yawgoo-valley', name: 'Yawgoo Valley', state: 'RI',
    latitude: 41.55, longitude: -71.60,
    base_elevation: 46, mid_elevation: mid(46, 113), peak_elevation: 113,
  },
  // ── New York ──────────────────────────────────────────────────────────────
  {
    id: 'beartown-ski-area', name: 'Beartown Ski Area', state: 'NY',
    latitude: 42.63, longitude: -74.13,
    base_elevation: 579, mid_elevation: mid(579, 823), peak_elevation: 823,
  },
  {
    id: 'belleayre-mountain', name: 'Belleayre Mountain', state: 'NY',
    latitude: 42.15, longitude: -74.49,
    base_elevation: 617, mid_elevation: mid(617, 1045), peak_elevation: 1045,
  },
  {
    id: 'brantling', name: 'Brantling Ski and Snowboard Center', state: 'NY',
    latitude: 43.23, longitude: -77.10,
    base_elevation: 91, mid_elevation: mid(91, 198), peak_elevation: 198,
  },
  {
    id: 'bristol-mountain', name: 'Bristol Mountain', state: 'NY',
    latitude: 42.73, longitude: -77.40,
    base_elevation: 366, mid_elevation: mid(366, 671), peak_elevation: 671,
  },
  {
    id: 'buffalo-ski-club', name: 'Buffalo Ski Club', state: 'NY',
    latitude: 42.65, longitude: -78.65,
    base_elevation: 411, mid_elevation: mid(411, 594), peak_elevation: 594,
  },
  {
    id: 'catamount-ski-area', name: 'Catamount Ski Area', state: 'NY',
    latitude: 42.22, longitude: -73.50,
    base_elevation: 305, mid_elevation: mid(305, 640), peak_elevation: 640,
  },
  {
    id: 'cazenovia-ski-club', name: 'Cazenovia Ski Club', state: 'NY',
    latitude: 42.93, longitude: -75.86,
    base_elevation: 442, mid_elevation: mid(442, 533), peak_elevation: 533,
  },
  {
    id: 'cockaigne-ski-area', name: 'Cockaigne Ski Area', state: 'NY',
    latitude: 42.30, longitude: -79.09,
    base_elevation: 457, mid_elevation: mid(457, 640), peak_elevation: 640,
  },
  {
    id: 'dry-hill-ski-area', name: 'Dry Hill Ski Area', state: 'NY',
    latitude: 44.01, longitude: -75.93,
    base_elevation: 213, mid_elevation: mid(213, 366), peak_elevation: 366,
  },
  {
    id: 'four-seasons-ski', name: 'Four Seasons Golf and Ski Center', state: 'NY',
    latitude: 42.69, longitude: -74.97,
    base_elevation: 396, mid_elevation: mid(396, 579), peak_elevation: 579,
  },
  {
    id: 'gore-mountain', name: 'Gore Mountain', state: 'NY',
    latitude: 43.67, longitude: -74.00,
    base_elevation: 335, mid_elevation: mid(335, 1092), peak_elevation: 1092,
  },
  {
    id: 'greek-peak', name: 'Greek Peak', state: 'NY',
    latitude: 42.51, longitude: -76.18,
    base_elevation: 335, mid_elevation: mid(335, 640), peak_elevation: 640,
  },
  {
    id: 'hickory-ski-center', name: 'Hickory Ski Center', state: 'NY',
    latitude: 43.58, longitude: -73.83,
    base_elevation: 366, mid_elevation: mid(366, 579), peak_elevation: 579,
  },
  {
    id: 'holiday-mountain', name: 'Holiday Mountain', state: 'NY',
    latitude: 41.61, longitude: -74.78,
    base_elevation: 335, mid_elevation: mid(335, 515), peak_elevation: 515,
  },
  {
    id: 'holiday-valley', name: 'Holiday Valley', state: 'NY',
    latitude: 42.28, longitude: -78.67,
    base_elevation: 457, mid_elevation: mid(457, 708), peak_elevation: 708,
  },
  {
    id: 'holimont', name: 'HoliMont', state: 'NY',
    latitude: 42.27, longitude: -78.72,
    base_elevation: 472, mid_elevation: mid(472, 671), peak_elevation: 671,
  },
  {
    id: 'hunt-hollow', name: 'Hunt Hollow Ski Club', state: 'NY',
    latitude: 42.65, longitude: -77.38,
    base_elevation: 472, mid_elevation: mid(472, 663), peak_elevation: 663,
  },
  {
    id: 'hunter-mountain', name: 'Hunter Mountain', state: 'NY',
    latitude: 42.18, longitude: -74.23,
    base_elevation: 488, mid_elevation: mid(488, 975), peak_elevation: 975,
  },
  {
    id: 'kissing-bridge', name: 'Kissing Bridge', state: 'NY',
    latitude: 42.59, longitude: -78.71,
    base_elevation: 363, mid_elevation: mid(363, 600), peak_elevation: 600,
  },
  {
    id: 'labrador-mountain', name: 'Labrador Mountain', state: 'NY',
    latitude: 42.66, longitude: -75.99,
    base_elevation: 488, mid_elevation: mid(488, 698), peak_elevation: 698,
  },
  {
    id: 'maple-ski-ridge', name: 'Maple Ski Ridge', state: 'NY',
    latitude: 42.82, longitude: -74.10,
    base_elevation: 274, mid_elevation: mid(274, 381), peak_elevation: 381,
  },
  {
    id: 'mccauley-mountain', name: 'McCauley Mountain', state: 'NY',
    latitude: 43.71, longitude: -74.93,
    base_elevation: 479, mid_elevation: mid(479, 785), peak_elevation: 785,
  },
  {
    id: 'mount-pisgah', name: 'Mount Pisgah', state: 'NY',
    latitude: 44.31, longitude: -74.13,
    base_elevation: 549, mid_elevation: mid(549, 732), peak_elevation: 732,
  },
  {
    id: 'mt-peter', name: 'Mt. Peter Ski Area', state: 'NY',
    latitude: 41.27, longitude: -74.28,
    base_elevation: 274, mid_elevation: mid(274, 386), peak_elevation: 386,
  },
  {
    id: 'oak-mountain', name: 'Oak Mountain Ski Center', state: 'NY',
    latitude: 43.51, longitude: -74.38,
    base_elevation: 472, mid_elevation: mid(472, 729), peak_elevation: 729,
  },
  {
    id: 'peekn-peak', name: "Peek'n Peak Resort", state: 'NY',
    latitude: 42.12, longitude: -79.36,
    base_elevation: 430, mid_elevation: mid(430, 535), peak_elevation: 535,
  },
  {
    id: 'plattekill', name: 'Plattekill', state: 'NY',
    latitude: 42.29, longitude: -74.59,
    base_elevation: 640, mid_elevation: mid(640, 1067), peak_elevation: 1067,
  },
  {
    id: 'polar-peak', name: 'Polar Peak Ski Bowl', state: 'NY',
    latitude: 44.30, longitude: -74.50,
    base_elevation: 488, mid_elevation: mid(488, 671), peak_elevation: 671,
  },
  {
    id: 'royal-mountain', name: 'Royal Mountain Ski Area', state: 'NY',
    latitude: 43.09, longitude: -74.47,
    base_elevation: 427, mid_elevation: mid(427, 622), peak_elevation: 622,
  },
  {
    id: 'ski-big-tupper', name: 'Ski Big Tupper Again', state: 'NY',
    latitude: 44.23, longitude: -74.38,
    base_elevation: 488, mid_elevation: mid(488, 832), peak_elevation: 832,
  },
  {
    id: 'ski-venture', name: 'Ski Venture', state: 'NY',
    latitude: 43.90, longitude: -75.38,
    base_elevation: 366, mid_elevation: mid(366, 610), peak_elevation: 610,
  },
  {
    id: 'snow-ridge', name: 'Snow Ridge Ski Area', state: 'NY',
    latitude: 43.63, longitude: -75.40,
    base_elevation: 393, mid_elevation: mid(393, 640), peak_elevation: 640,
  },
  {
    id: 'song-mountain', name: 'Song Mountain', state: 'NY',
    latitude: 42.79, longitude: -76.13,
    base_elevation: 378, mid_elevation: mid(378, 591), peak_elevation: 591,
  },
  {
    id: 'swain-resort', name: 'Swain Resort', state: 'NY',
    latitude: 42.48, longitude: -77.88,
    base_elevation: 402, mid_elevation: mid(402, 607), peak_elevation: 607,
  },
  {
    id: 'thunder-ridge', name: 'Thunder Ridge Ski Area', state: 'NY',
    latitude: 41.50, longitude: -73.60,
    base_elevation: 274, mid_elevation: mid(274, 427), peak_elevation: 427,
  },
  {
    id: 'titus-mountain', name: 'Titus Mountain', state: 'NY',
    latitude: 44.76, longitude: -74.23,
    base_elevation: 251, mid_elevation: mid(251, 617), peak_elevation: 617,
  },
  {
    id: 'west-mountain', name: 'West Mountain Ski Center', state: 'NY',
    latitude: 43.32, longitude: -73.63,
    base_elevation: 259, mid_elevation: mid(259, 506), peak_elevation: 506,
  },
  {
    id: 'whiteface-mountain', name: 'Whiteface Mountain', state: 'NY',
    latitude: 44.37, longitude: -73.90,
    base_elevation: 372, mid_elevation: mid(372, 1337), peak_elevation: 1337,
  },
  {
    id: 'willard-mountain', name: 'Willard Mountain', state: 'NY',
    latitude: 43.12, longitude: -73.48,
    base_elevation: 213, mid_elevation: mid(213, 411), peak_elevation: 411,
  },
  {
    id: 'windham-mountain', name: 'Windham Mountain', state: 'NY',
    latitude: 42.30, longitude: -74.25,
    base_elevation: 457, mid_elevation: mid(457, 945), peak_elevation: 945,
  },
  {
    id: 'woods-valley', name: 'Woods Valley Ski Area', state: 'NY',
    latitude: 43.26, longitude: -75.43,
    base_elevation: 427, mid_elevation: mid(427, 640), peak_elevation: 640,
  },
  // ── New Jersey ────────────────────────────────────────────────────────────
  {
    id: 'campgaw-mountain', name: 'Campgaw Mountain', state: 'NJ',
    latitude: 41.07, longitude: -74.21,
    base_elevation: 104, mid_elevation: mid(104, 219), peak_elevation: 219,
  },
  {
    id: 'mountain-creek', name: 'Mountain Creek Resort', state: 'NJ',
    latitude: 41.22, longitude: -74.47,
    base_elevation: 286, mid_elevation: mid(286, 451), peak_elevation: 451,
  },
];

export const RESORTS_BY_ID = new Map<string, Resort>(RESORTS.map(r => [r.id, r]));
