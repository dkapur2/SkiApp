import asyncio
import httpx
from datetime import datetime, timezone, timedelta
from typing import Any


def _mid(base: int, peak: int) -> int:
    return (base + peak) // 2


# Elevations stored in meters. Base/peak from official sources; mid computed as midpoint.
RESORTS = [
    # ── Pennsylvania ──────────────────────────────────────────────────────
    {
        "id": "bear-creek",
        "name": "Bear Creek",
        "state": "PA",
        "latitude": 40.4761,
        "longitude": -75.6258,
        "base_elevation": 180,    # 590 ft
        "mid_elevation": _mid(180, 335),
        "peak_elevation": 335,    # 1,100 ft
    },
    {
        "id": "blue-knob",
        "name": "Blue Knob",
        "state": "PA",
        "latitude": 40.2880,
        "longitude": -78.5623,
        "base_elevation": 632,    # 2,074 ft
        "mid_elevation": _mid(632, 967),
        "peak_elevation": 967,    # 3,172 ft
    },
    {
        "id": "blue-mountain",
        "name": "Blue Mountain",
        "state": "PA",
        "latitude": 40.8167,
        "longitude": -75.5167,
        "base_elevation": 140,    # 460 ft
        "mid_elevation": _mid(140, 488),
        "peak_elevation": 488,    # 1,600 ft
    },
    {
        "id": "boyce-park",
        "name": "Boyce Park",
        "state": "PA",
        "latitude": 40.3170,
        "longitude": -80.0924,
        "base_elevation": 333,    # 1,092 ft
        "mid_elevation": _mid(333, 388),
        "peak_elevation": 388,    # 1,272 ft
    },
    {
        "id": "camelback",
        "name": "Camelback",
        "state": "PA",
        "latitude": 41.0500,
        "longitude": -75.3500,
        "base_elevation": 378,    # 1,239 ft
        "mid_elevation": _mid(378, 650),
        "peak_elevation": 650,    # 2,133 ft
    },
    {
        "id": "eagle-rock",
        "name": "Eagle Rock Resort",
        "state": "PA",
        "latitude": 40.7200,
        "longitude": -75.6500,
        "base_elevation": 384,    # 1,260 ft
        "mid_elevation": _mid(384, 552),
        "peak_elevation": 552,    # 1,810 ft
    },
    {
        "id": "elk-mountain",
        "name": "Elk Mountain",
        "state": "PA",
        "latitude": 41.7200,
        "longitude": -75.5500,
        "base_elevation": 516,    # 1,693 ft
        "mid_elevation": _mid(516, 821),
        "peak_elevation": 821,    # 2,694 ft
    },
    {
        "id": "hidden-valley",
        "name": "Hidden Valley",
        "state": "PA",
        "latitude": 40.1567,
        "longitude": -79.1839,
        "base_elevation": 701,    # 2,300 ft
        "mid_elevation": _mid(701, 876),
        "peak_elevation": 876,    # 2,875 ft
    },
    {
        "id": "jack-frost-big-boulder",
        "name": "Jack Frost Big Boulder",
        "state": "PA",
        "latitude": 41.1075,
        "longitude": -75.6531,
        "base_elevation": 427,    # 1,400 ft
        "mid_elevation": _mid(427, 663),
        "peak_elevation": 663,    # 2,175 ft
    },
    {
        "id": "laurel-mountain",
        "name": "Laurel Mountain",
        "state": "PA",
        "latitude": 40.1565,
        "longitude": -79.1678,
        "base_elevation": 610,    # 2,000 ft
        "mid_elevation": _mid(610, 798),
        "peak_elevation": 798,    # 2,618 ft
    },
    {
        "id": "liberty",
        "name": "Liberty",
        "state": "PA",
        "latitude": 39.7954,
        "longitude": -77.3994,
        "base_elevation": 174,    # 570 ft
        "mid_elevation": 269,     # ~883 ft (midpoint)
        "peak_elevation": 363,    # 1,190 ft
    },
    {
        "id": "montage-mountain",
        "name": "Montage Mountain",
        "state": "PA",
        "latitude": 41.3533,
        "longitude": -75.6592,
        "base_elevation": 293,    # 960 ft
        "mid_elevation": _mid(293, 597),
        "peak_elevation": 597,    # 1,960 ft
    },
    {
        "id": "mount-pleasant",
        "name": "Mount Pleasant of Edinboro",
        "state": "PA",
        "latitude": 41.8519,
        "longitude": -80.0710,
        "base_elevation": 320,    # 1,050 ft
        "mid_elevation": _mid(320, 472),
        "peak_elevation": 472,    # 1,550 ft
    },
    {
        "id": "mystic-mountain",
        "name": "Mystic Mountain at Nemacolin",
        "state": "PA",
        "latitude": 39.8119,
        "longitude": -79.5435,
        "base_elevation": 823,    # 2,700 ft
        "mid_elevation": _mid(823, 945),
        "peak_elevation": 945,    # 3,100 ft
    },
    {
        "id": "seven-springs",
        "name": "Seven Springs",
        "state": "PA",
        "latitude": 40.0231,
        "longitude": -79.2928,
        "base_elevation": 640,    # 2,100 ft
        "mid_elevation": _mid(640, 913),
        "peak_elevation": 913,    # 2,994 ft
    },
    {
        "id": "shawnee-mountain",
        "name": "Shawnee Mountain",
        "state": "PA",
        "latitude": 41.0300,
        "longitude": -75.0700,
        "base_elevation": 198,    # 650 ft
        "mid_elevation": _mid(198, 411),
        "peak_elevation": 411,    # 1,350 ft
    },
    {
        "id": "ski-big-bear",
        "name": "Ski Big Bear",
        "state": "PA",
        "latitude": 41.2033,
        "longitude": -75.3300,
        "base_elevation": 183,    # 600 ft
        "mid_elevation": _mid(183, 381),
        "peak_elevation": 381,    # 1,250 ft
    },
    {
        "id": "ski-roundtop",
        "name": "Ski Roundtop",
        "state": "PA",
        "latitude": 40.1100,
        "longitude": -76.8750,
        "base_elevation": 230,    # 755 ft
        "mid_elevation": _mid(230, 407),
        "peak_elevation": 407,    # 1,335 ft
    },
    {
        "id": "ski-sawmill",
        "name": "Ski SawMill",
        "state": "PA",
        "latitude": 41.5200,
        "longitude": -77.2900,
        "base_elevation": 539,    # 1,770 ft
        "mid_elevation": _mid(539, 675),
        "peak_elevation": 675,    # 2,215 ft
    },
    {
        "id": "spring-mountain",
        "name": "Spring Mountain",
        "state": "PA",
        "latitude": 40.1867,
        "longitude": -75.3750,
        "base_elevation": 24,     # 78 ft
        "mid_elevation": _mid(24, 161),
        "peak_elevation": 161,    # 528 ft
    },
    {
        "id": "tussey-mountain",
        "name": "Tussey Mountain",
        "state": "PA",
        "latitude": 40.7692,
        "longitude": -77.7533,
        "base_elevation": 399,    # 1,310 ft
        "mid_elevation": _mid(399, 555),
        "peak_elevation": 555,    # 1,819 ft
    },
    {
        "id": "whitetail",
        "name": "Whitetail",
        "state": "PA",
        "latitude": 39.7360,
        "longitude": -77.8990,
        "base_elevation": 264,    # 865 ft
        "mid_elevation": 407,     # ~1,335 ft (midpoint)
        "peak_elevation": 549,    # 1,800 ft
    },
    # ── Maryland ──────────────────────────────────────────────────────────
    {
        "id": "wisp",
        "name": "Wisp Resort",
        "state": "MD",
        "latitude": 39.5569,
        "longitude": -79.3634,
        "base_elevation": 736,    # 2,415 ft
        "mid_elevation": _mid(736, 949),
        "peak_elevation": 949,    # 3,115 ft
    },
    # ── Virginia ──────────────────────────────────────────────────────────
    {
        "id": "bryce-resort",
        "name": "Bryce Resort",
        "state": "VA",
        "latitude": 38.8175,
        "longitude": -78.7660,
        "base_elevation": 381,    # 1,250 ft
        "mid_elevation": _mid(381, 533),
        "peak_elevation": 533,    # 1,750 ft
    },
    {
        "id": "massanutten",
        "name": "Massanutten",
        "state": "VA",
        "latitude": 38.4093,
        "longitude": -78.7539,
        "base_elevation": 533,    # 1,750 ft
        "mid_elevation": _mid(533, 892),
        "peak_elevation": 892,    # 2,925 ft
    },
    {
        "id": "omni-homestead",
        "name": "The Omni Homestead",
        "state": "VA",
        "latitude": 37.7829,
        "longitude": -79.8283,
        "base_elevation": 762,    # 2,500 ft
        "mid_elevation": _mid(762, 975),
        "peak_elevation": 975,    # 3,200 ft
    },
    {
        "id": "wintergreen",
        "name": "Wintergreen Resort",
        "state": "VA",
        "latitude": 37.9142,
        "longitude": -78.9438,
        "base_elevation": 766,    # 2,512 ft
        "mid_elevation": _mid(766, 1071),
        "peak_elevation": 1071,   # 3,515 ft
    },
    # ── West Virginia ─────────────────────────────────────────────────────
    {
        "id": "canaan-valley",
        "name": "Canaan Valley Resort",
        "state": "WV",
        "latitude": 39.0273,
        "longitude": -79.4620,
        "base_elevation": 1046,   # 3,430 ft
        "mid_elevation": _mid(1046, 1305),
        "peak_elevation": 1305,   # 4,280 ft
    },
    {
        "id": "oglebay",
        "name": "Oglebay Resort",
        "state": "WV",
        "latitude": 40.0661,
        "longitude": -80.6942,
        "base_elevation": 248,    # 815 ft
        "mid_elevation": _mid(248, 335),
        "peak_elevation": 335,    # 1,100 ft
    },
    {
        "id": "snowshoe",
        "name": "Snowshoe",
        "state": "WV",
        "latitude": 38.4023,
        "longitude": -79.9939,
        "base_elevation": 1020,   # 3,348 ft
        "mid_elevation": 1249,    # ~4,098 ft (midpoint)
        "peak_elevation": 1478,   # 4,848 ft
    },
    {
        "id": "timberline",
        "name": "Timberline Mountain",
        "state": "WV",
        "latitude": 39.1311,
        "longitude": -79.4663,
        "base_elevation": 996,    # 3,268 ft
        "mid_elevation": _mid(996, 1301),
        "peak_elevation": 1301,   # 4,268 ft
    },
    {
        "id": "winterplace",
        "name": "Winterplace Ski Resort",
        "state": "WV",
        "latitude": 37.8800,
        "longitude": -81.1200,
        "base_elevation": 914,    # 2,997 ft
        "mid_elevation": _mid(914, 1097),
        "peak_elevation": 1097,   # 3,600 ft
    },
    # ── North Carolina ────────────────────────────────────────────────────
    {
        "id": "appalachian-ski-mountain",
        "name": "Appalachian Ski Mountain",
        "state": "NC",
        "latitude": 36.1750,
        "longitude": -81.6650,
        "base_elevation": 1108,   # 3,635 ft
        "mid_elevation": _mid(1108, 1219),
        "peak_elevation": 1219,   # 4,000 ft
    },
    {
        "id": "beech-mountain",
        "name": "Beech Mountain Resort",
        "state": "NC",
        "latitude": 36.1846,
        "longitude": -81.8815,
        "base_elevation": 1425,   # 4,675 ft
        "mid_elevation": _mid(1425, 1678),
        "peak_elevation": 1678,   # 5,506 ft
    },
    {
        "id": "cataloochee",
        "name": "Cataloochee Ski Area",
        "state": "NC",
        "latitude": 35.5624,
        "longitude": -83.0900,
        "base_elevation": 1420,   # 4,660 ft
        "mid_elevation": _mid(1420, 1646),
        "peak_elevation": 1646,   # 5,400 ft
    },
    {
        "id": "hatley-pointe",
        "name": "Hatley Pointe",
        "state": "NC",
        "latitude": 35.8264,
        "longitude": -82.5496,
        "base_elevation": 1219,   # 4,000 ft
        "mid_elevation": _mid(1219, 1433),
        "peak_elevation": 1433,   # 4,700 ft
    },
    {
        "id": "sapphire-valley",
        "name": "Sapphire Valley",
        "state": "NC",
        "latitude": 35.1070,
        "longitude": -83.0029,
        "base_elevation": 975,    # 3,200 ft
        "mid_elevation": _mid(975, 1052),
        "peak_elevation": 1052,   # 3,450 ft
    },
    {
        "id": "sugar-mountain",
        "name": "Sugar Mountain Resort",
        "state": "NC",
        "latitude": 36.1246,
        "longitude": -81.8757,
        "base_elevation": 1250,   # 4,100 ft
        "mid_elevation": _mid(1250, 1615),
        "peak_elevation": 1615,   # 5,300 ft
    },
    # ── Tennessee ─────────────────────────────────────────────────────────
    {
        "id": "ober-mountain",
        "name": "Ober Mountain",
        "state": "TN",
        "latitude": 35.7059,
        "longitude": -83.5575,
        "base_elevation": 823,    # 2,700 ft
        "mid_elevation": _mid(823, 1006),
        "peak_elevation": 1006,   # 3,300 ft
    },
    # ── Vermont ───────────────────────────────────────────────────────────
    {
        "id": "bolton-valley",
        "name": "Bolton Valley",
        "state": "VT",
        "latitude": 44.42,
        "longitude": -72.87,
        "base_elevation": 640,    # 2,100 ft
        "mid_elevation": _mid(640, 960),
        "peak_elevation": 960,    # 3,150 ft
    },
    {
        "id": "brattleboro-ski-hill",
        "name": "Brattleboro Ski Hill",
        "state": "VT",
        "latitude": 42.86,
        "longitude": -72.54,
        "base_elevation": 131,    # 430 ft
        "mid_elevation": _mid(131, 238),
        "peak_elevation": 238,    # 780 ft
    },
    {
        "id": "bromley-mountain",
        "name": "Bromley Mountain Resort",
        "state": "VT",
        "latitude": 43.22,
        "longitude": -72.94,
        "base_elevation": 597,    # 1,960 ft
        "mid_elevation": _mid(597, 1001),
        "peak_elevation": 1001,   # 3,284 ft
    },
    {
        "id": "burke-mountain",
        "name": "Burke Mountain Resort",
        "state": "VT",
        "latitude": 44.60,
        "longitude": -71.90,
        "base_elevation": 368,    # 1,206 ft
        "mid_elevation": _mid(368, 996),
        "peak_elevation": 996,    # 3,267 ft
    },
    {
        "id": "cochrans-ski-area",
        "name": "Cochran's Ski Area",
        "state": "VT",
        "latitude": 44.40,
        "longitude": -72.99,
        "base_elevation": 183,    # 600 ft
        "mid_elevation": _mid(183, 366),
        "peak_elevation": 366,    # 1,200 ft
    },
    {
        "id": "jay-peak",
        "name": "Jay Peak",
        "state": "VT",
        "latitude": 44.9256,
        "longitude": -72.5120,
        "base_elevation": 533,    # 1,750 ft
        "mid_elevation": 855,     # ~2,805 ft (midpoint)
        "peak_elevation": 1177,   # 3,862 ft
    },
    {
        "id": "killington",
        "name": "Killington",
        "state": "VT",
        "latitude": 43.68,
        "longitude": -72.82,
        "base_elevation": 355,    # 1,165 ft
        "mid_elevation": _mid(355, 1289),
        "peak_elevation": 1289,   # 4,229 ft
    },
    {
        "id": "lyndon-outing-club",
        "name": "Lyndon Outing Club",
        "state": "VT",
        "latitude": 44.53,
        "longitude": -72.02,
        "base_elevation": 274,    # 900 ft
        "mid_elevation": _mid(274, 427),
        "peak_elevation": 427,    # 1,400 ft
    },
    {
        "id": "mad-river-glen",
        "name": "Mad River Glen",
        "state": "VT",
        "latitude": 44.19,
        "longitude": -72.91,
        "base_elevation": 488,    # 1,600 ft
        "mid_elevation": _mid(488, 1109),
        "peak_elevation": 1109,   # 3,637 ft
    },
    {
        "id": "magic-mountain",
        "name": "Magic Mountain",
        "state": "VT",
        "latitude": 43.19,
        "longitude": -72.77,
        "base_elevation": 411,    # 1,350 ft
        "mid_elevation": _mid(411, 871),
        "peak_elevation": 871,    # 2,858 ft
    },
    {
        "id": "middlebury-snowbowl",
        "name": "Middlebury Snowbowl",
        "state": "VT",
        "latitude": 43.96,
        "longitude": -73.02,
        "base_elevation": 380,    # 1,246 ft
        "mid_elevation": _mid(380, 795),
        "peak_elevation": 795,    # 2,610 ft
    },
    {
        "id": "mount-snow",
        "name": "Mount Snow Resort",
        "state": "VT",
        "latitude": 42.97,
        "longitude": -72.92,
        "base_elevation": 579,    # 1,900 ft
        "mid_elevation": _mid(579, 1097),
        "peak_elevation": 1097,   # 3,600 ft
    },
    {
        "id": "northeast-slopes",
        "name": "Northeast Slopes",
        "state": "VT",
        "latitude": 44.12,
        "longitude": -72.35,
        "base_elevation": 274,    # 900 ft
        "mid_elevation": _mid(274, 427),
        "peak_elevation": 427,    # 1,400 ft
    },
    {
        "id": "okemo",
        "name": "Okemo",
        "state": "VT",
        "latitude": 43.40,
        "longitude": -72.73,
        "base_elevation": 349,    # 1,144 ft
        "mid_elevation": _mid(349, 1019),
        "peak_elevation": 1019,   # 3,344 ft
    },
    {
        "id": "pico-mountain",
        "name": "Pico Mountain",
        "state": "VT",
        "latitude": 43.67,
        "longitude": -72.85,
        "base_elevation": 599,    # 1,967 ft
        "mid_elevation": _mid(599, 1209),
        "peak_elevation": 1209,   # 3,967 ft
    },
    {
        "id": "quechee",
        "name": "Quechee Ski Hill",
        "state": "VT",
        "latitude": 43.64,
        "longitude": -72.42,
        "base_elevation": 213,    # 700 ft
        "mid_elevation": _mid(213, 335),
        "peak_elevation": 335,    # 1,100 ft
    },
    {
        "id": "saskadena-six",
        "name": "Saskadena Six",
        "state": "VT",
        "latitude": 43.71,
        "longitude": -72.52,
        "base_elevation": 290,    # 950 ft
        "mid_elevation": _mid(290, 427),
        "peak_elevation": 427,    # 1,400 ft
    },
    {
        "id": "smugglers-notch",
        "name": "Smugglers' Notch Resort",
        "state": "VT",
        "latitude": 44.56,
        "longitude": -72.78,
        "base_elevation": 314,    # 1,030 ft
        "mid_elevation": _mid(314, 1109),
        "peak_elevation": 1109,   # 3,640 ft
    },
    {
        "id": "stowe",
        "name": "Stowe",
        "state": "VT",
        "latitude": 44.5303,
        "longitude": -72.7814,
        "base_elevation": 390,    # 1,280 ft
        "mid_elevation": 1105,    # 3,625 ft (official Spruce Peak skiing top)
        "peak_elevation": 1340,   # 4,395 ft (Mt. Mansfield summit)
    },
    {
        "id": "stratton",
        "name": "Stratton",
        "state": "VT",
        "latitude": 43.12,
        "longitude": -72.91,
        "base_elevation": 570,    # 1,872 ft
        "mid_elevation": _mid(570, 1181),
        "peak_elevation": 1181,   # 3,875 ft
    },
    {
        "id": "sugarbush",
        "name": "Sugarbush",
        "state": "VT",
        "latitude": 44.13,
        "longitude": -72.90,
        "base_elevation": 452,    # 1,483 ft
        "mid_elevation": _mid(452, 1245),
        "peak_elevation": 1245,   # 4,083 ft
    },
    # ── Maine ─────────────────────────────────────────────────────────────
    {
        "id": "baker-mountain",
        "name": "Baker Mountain",
        "state": "ME",
        "latitude": 44.77,
        "longitude": -70.17,
        "base_elevation": 250,    # 820 ft
        "mid_elevation": _mid(250, 399),
        "peak_elevation": 399,    # 1,310 ft
    },
    {
        "id": "bigrock-mountain",
        "name": "BigRock Mountain",
        "state": "ME",
        "latitude": 46.52,
        "longitude": -67.84,
        "base_elevation": 296,    # 970 ft
        "mid_elevation": _mid(296, 531),
        "peak_elevation": 531,    # 1,742 ft
    },
    {
        "id": "big-squaw-mountain",
        "name": "Big Squaw Mountain",
        "state": "ME",
        "latitude": 45.47,
        "longitude": -69.63,
        "base_elevation": 533,    # 1,750 ft
        "mid_elevation": _mid(533, 974),
        "peak_elevation": 974,    # 3,196 ft
    },
    {
        "id": "black-mountain-maine",
        "name": "Black Mountain of Maine",
        "state": "ME",
        "latitude": 44.56,
        "longitude": -70.56,
        "base_elevation": 296,    # 970 ft
        "mid_elevation": _mid(296, 727),
        "peak_elevation": 727,    # 2,385 ft
    },
    {
        "id": "camden-snow-bowl",
        "name": "Camden Snow Bowl",
        "state": "ME",
        "latitude": 44.21,
        "longitude": -69.09,
        "base_elevation": 107,    # 350 ft
        "mid_elevation": _mid(107, 396),
        "peak_elevation": 396,    # 1,300 ft
    },
    {
        "id": "hermon-mountain",
        "name": "Hermon Mountain",
        "state": "ME",
        "latitude": 44.81,
        "longitude": -68.90,
        "base_elevation": 30,     # 100 ft
        "mid_elevation": _mid(30, 137),
        "peak_elevation": 137,    # 450 ft
    },
    {
        "id": "lonesome-pine-trails",
        "name": "Lonesome Pine Trails",
        "state": "ME",
        "latitude": 47.25,
        "longitude": -68.59,
        "base_elevation": 174,    # 570 ft
        "mid_elevation": _mid(174, 299),
        "peak_elevation": 299,    # 981 ft
    },
    {
        "id": "lost-valley",
        "name": "Lost Valley",
        "state": "ME",
        "latitude": 44.09,
        "longitude": -70.29,
        "base_elevation": 78,     # 255 ft
        "mid_elevation": _mid(78, 151),
        "peak_elevation": 151,    # 495 ft
    },
    {
        "id": "mt-abram",
        "name": "Mt. Abram Ski Resort",
        "state": "ME",
        "latitude": 44.37,
        "longitude": -70.70,
        "base_elevation": 299,    # 980 ft
        "mid_elevation": _mid(299, 608),
        "peak_elevation": 608,    # 1,995 ft
    },
    {
        "id": "powderhouse-hill",
        "name": "Powderhouse Hill",
        "state": "ME",
        "latitude": 44.36,
        "longitude": -69.52,
        "base_elevation": 91,     # 300 ft
        "mid_elevation": _mid(91, 152),
        "peak_elevation": 152,    # 500 ft
    },
    {
        "id": "quoggy-jo",
        "name": "Quoggy Jo Ski Center",
        "state": "ME",
        "latitude": 46.71,
        "longitude": -68.04,
        "base_elevation": 217,    # 712 ft
        "mid_elevation": _mid(217, 275),
        "peak_elevation": 275,    # 902 ft
    },
    {
        "id": "saddleback",
        "name": "Saddleback",
        "state": "ME",
        "latitude": 44.84,
        "longitude": -70.59,
        "base_elevation": 752,    # 2,469 ft
        "mid_elevation": _mid(752, 1256),
        "peak_elevation": 1256,   # 4,120 ft
    },
    {
        "id": "pleasant-mountain",
        "name": "Pleasant Mountain",
        "state": "ME",
        "latitude": 44.04,
        "longitude": -70.76,
        "base_elevation": 137,    # 450 ft
        "mid_elevation": _mid(137, 611),
        "peak_elevation": 611,    # 2,006 ft
    },
    {
        "id": "spruce-mountain",
        "name": "Spruce Mountain",
        "state": "ME",
        "latitude": 44.47,
        "longitude": -70.35,
        "base_elevation": 198,    # 650 ft
        "mid_elevation": _mid(198, 451),
        "peak_elevation": 451,    # 1,480 ft
    },
    {
        "id": "sugarloaf",
        "name": "Sugarloaf",
        "state": "ME",
        "latitude": 45.03,
        "longitude": -70.31,
        "base_elevation": 432,    # 1,417 ft
        "mid_elevation": _mid(432, 1291),
        "peak_elevation": 1291,   # 4,237 ft
    },
    {
        "id": "sunday-river",
        "name": "Sunday River",
        "state": "ME",
        "latitude": 44.47,
        "longitude": -70.86,
        "base_elevation": 244,    # 800 ft
        "mid_elevation": _mid(244, 957),
        "peak_elevation": 957,    # 3,140 ft
    },
    {
        "id": "titcomb-mountain",
        "name": "Titcomb Mountain",
        "state": "ME",
        "latitude": 44.67,
        "longitude": -70.15,
        "base_elevation": 244,    # 800 ft
        "mid_elevation": _mid(244, 451),
        "peak_elevation": 451,    # 1,480 ft
    },
    # ── New Hampshire ─────────────────────────────────────────────────────
    {
        "id": "abenaki-ski-area",
        "name": "Abenaki Ski Area",
        "state": "NH",
        "latitude": 43.59,
        "longitude": -71.20,
        "base_elevation": 213,    # 700 ft
        "mid_elevation": _mid(213, 427),
        "peak_elevation": 427,    # 1,400 ft
    },
    {
        "id": "arrowhead-ski-area",
        "name": "Arrowhead Ski Area",
        "state": "NH",
        "latitude": 43.30,
        "longitude": -71.88,
        "base_elevation": 183,    # 600 ft
        "mid_elevation": _mid(183, 396),
        "peak_elevation": 396,    # 1,300 ft
    },
    {
        "id": "attitash-mountain",
        "name": "Attitash Mountain",
        "state": "NH",
        "latitude": 44.09,
        "longitude": -71.21,
        "base_elevation": 183,    # 600 ft
        "mid_elevation": _mid(183, 716),
        "peak_elevation": 716,    # 2,350 ft
    },
    {
        "id": "black-mountain-nh",
        "name": "Black Mountain",
        "state": "NH",
        "latitude": 44.17,
        "longitude": -71.17,
        "base_elevation": 335,    # 1,100 ft
        "mid_elevation": _mid(335, 840),
        "peak_elevation": 840,    # 2,757 ft
    },
    {
        "id": "bretton-woods",
        "name": "Bretton Woods",
        "state": "NH",
        "latitude": 44.26,
        "longitude": -71.45,
        "base_elevation": 498,    # 1,634 ft
        "mid_elevation": _mid(498, 945),
        "peak_elevation": 945,    # 3,100 ft
    },
    {
        "id": "cannon-mountain",
        "name": "Cannon Mountain",
        "state": "NH",
        "latitude": 44.16,
        "longitude": -71.70,
        "base_elevation": 584,    # 1,916 ft
        "mid_elevation": _mid(584, 1244),
        "peak_elevation": 1244,   # 4,080 ft
    },
    {
        "id": "cranmore-mountain",
        "name": "Cranmore Mountain Resort",
        "state": "NH",
        "latitude": 44.05,
        "longitude": -71.10,
        "base_elevation": 293,    # 960 ft
        "mid_elevation": _mid(293, 628),
        "peak_elevation": 628,    # 2,060 ft
    },
    {
        "id": "crotched-mountain",
        "name": "Crotched Mountain",
        "state": "NH",
        "latitude": 43.17,
        "longitude": -71.95,
        "base_elevation": 320,    # 1,050 ft
        "mid_elevation": _mid(320, 630),
        "peak_elevation": 630,    # 2,066 ft
    },
    {
        "id": "dartmouth-skiway",
        "name": "Dartmouth Skiway",
        "state": "NH",
        "latitude": 43.89,
        "longitude": -72.21,
        "base_elevation": 295,    # 968 ft
        "mid_elevation": _mid(295, 592),
        "peak_elevation": 592,    # 1,943 ft
    },
    {
        "id": "granite-gorge",
        "name": "Granite Gorge Mountain Park",
        "state": "NH",
        "latitude": 42.97,
        "longitude": -72.18,
        "base_elevation": 274,    # 900 ft
        "mid_elevation": _mid(274, 500),
        "peak_elevation": 500,    # 1,640 ft
    },
    {
        "id": "gunstock-mountain",
        "name": "Gunstock Mountain Resort",
        "state": "NH",
        "latitude": 43.54,
        "longitude": -71.37,
        "base_elevation": 325,    # 1,066 ft
        "mid_elevation": _mid(325, 684),
        "peak_elevation": 684,    # 2,245 ft
    },
    {
        "id": "king-pine",
        "name": "King Pine",
        "state": "NH",
        "latitude": 43.87,
        "longitude": -71.13,
        "base_elevation": 244,    # 800 ft
        "mid_elevation": _mid(244, 457),
        "peak_elevation": 457,    # 1,500 ft
    },
    {
        "id": "loon-mountain",
        "name": "Loon Mountain Resort",
        "state": "NH",
        "latitude": 44.04,
        "longitude": -71.62,
        "base_elevation": 272,    # 892 ft
        "mid_elevation": _mid(272, 930),
        "peak_elevation": 930,    # 3,050 ft
    },
    {
        "id": "mcintyre-ski-area",
        "name": "McIntyre Ski Area",
        "state": "NH",
        "latitude": 43.00,
        "longitude": -71.53,
        "base_elevation": 152,    # 500 ft
        "mid_elevation": _mid(152, 335),
        "peak_elevation": 335,    # 1,100 ft
    },
    {
        "id": "mount-sunapee",
        "name": "Mount Sunapee",
        "state": "NH",
        "latitude": 43.35,
        "longitude": -72.07,
        "base_elevation": 376,    # 1,233 ft
        "mid_elevation": _mid(376, 836),
        "peak_elevation": 836,    # 2,743 ft
    },
    {
        "id": "pats-peak",
        "name": "Pats Peak",
        "state": "NH",
        "latitude": 43.19,
        "longitude": -71.80,
        "base_elevation": 210,    # 690 ft
        "mid_elevation": _mid(210, 445),
        "peak_elevation": 445,    # 1,460 ft
    },
    {
        "id": "ragged-mountain-nh",
        "name": "Ragged Mountain Resort",
        "state": "NH",
        "latitude": 43.53,
        "longitude": -71.85,
        "base_elevation": 305,    # 1,000 ft
        "mid_elevation": _mid(305, 677),
        "peak_elevation": 677,    # 2,220 ft
    },
    {
        "id": "storrs-hill",
        "name": "Storrs Hill Ski Area",
        "state": "NH",
        "latitude": 43.65,
        "longitude": -72.25,
        "base_elevation": 137,    # 450 ft
        "mid_elevation": _mid(137, 290),
        "peak_elevation": 290,    # 950 ft
    },
    {
        "id": "tenney-mountain",
        "name": "Tenney Mountain",
        "state": "NH",
        "latitude": 43.77,
        "longitude": -71.71,
        "base_elevation": 274,    # 900 ft
        "mid_elevation": _mid(274, 628),
        "peak_elevation": 628,    # 2,060 ft
    },
    {
        "id": "waterville-valley",
        "name": "Waterville Valley Resort",
        "state": "NH",
        "latitude": 43.97,
        "longitude": -71.52,
        "base_elevation": 605,    # 1,984 ft
        "mid_elevation": _mid(605, 1220),
        "peak_elevation": 1220,   # 4,004 ft
    },
    {
        "id": "whaleback-mountain",
        "name": "Whaleback Mountain",
        "state": "NH",
        "latitude": 43.62,
        "longitude": -72.13,
        "base_elevation": 183,    # 600 ft
        "mid_elevation": _mid(183, 332),
        "peak_elevation": 332,    # 1,090 ft
    },
    {
        "id": "wildcat-mountain",
        "name": "Wildcat Mountain",
        "state": "NH",
        "latitude": 44.26,
        "longitude": -71.23,
        "base_elevation": 644,    # 2,112 ft
        "mid_elevation": _mid(644, 1238),
        "peak_elevation": 1238,   # 4,062 ft
    },
    # ── Massachusetts ─────────────────────────────────────────────────────
    {
        "id": "berkshire-east",
        "name": "Berkshire East",
        "state": "MA",
        "latitude": 42.63,
        "longitude": -72.87,
        "base_elevation": 201,    # 660 ft
        "mid_elevation": _mid(201, 561),
        "peak_elevation": 561,    # 1,840 ft
    },
    {
        "id": "blue-hills-ski-area",
        "name": "Blue Hills Ski Area",
        "state": "MA",
        "latitude": 42.22,
        "longitude": -71.10,
        "base_elevation": 99,     # 326 ft
        "mid_elevation": _mid(99, 194),
        "peak_elevation": 194,    # 635 ft
    },
    {
        "id": "bousquet-ski-area",
        "name": "Bousquet Ski Area",
        "state": "MA",
        "latitude": 42.43,
        "longitude": -73.28,
        "base_elevation": 366,    # 1,200 ft
        "mid_elevation": _mid(366, 561),
        "peak_elevation": 561,    # 1,840 ft
    },
    {
        "id": "bradford-ski-area",
        "name": "Bradford Ski Area",
        "state": "MA",
        "latitude": 42.78,
        "longitude": -71.10,
        "base_elevation": 49,     # 160 ft
        "mid_elevation": _mid(49, 305),
        "peak_elevation": 305,    # 1,000 ft
    },
    {
        "id": "jiminy-peak",
        "name": "Jiminy Peak",
        "state": "MA",
        "latitude": 42.55,
        "longitude": -73.34,
        "base_elevation": 356,    # 1,167 ft
        "mid_elevation": _mid(356, 725),
        "peak_elevation": 725,    # 2,380 ft
    },
    {
        "id": "nashoba-valley",
        "name": "Nashoba Valley",
        "state": "MA",
        "latitude": 42.48,
        "longitude": -71.58,
        "base_elevation": 70,     # 230 ft
        "mid_elevation": _mid(70, 152),
        "peak_elevation": 152,    # 500 ft
    },
    {
        "id": "otis-ridge",
        "name": "Otis Ridge Ski Area",
        "state": "MA",
        "latitude": 42.19,
        "longitude": -73.08,
        "base_elevation": 335,    # 1,100 ft
        "mid_elevation": _mid(335, 549),
        "peak_elevation": 549,    # 1,800 ft
    },
    {
        "id": "ski-butternut",
        "name": "Ski Butternut",
        "state": "MA",
        "latitude": 42.19,
        "longitude": -73.37,
        "base_elevation": 323,    # 1,060 ft
        "mid_elevation": _mid(323, 564),
        "peak_elevation": 564,    # 1,850 ft
    },
    {
        "id": "ski-ward",
        "name": "Ski Ward",
        "state": "MA",
        "latitude": 42.29,
        "longitude": -71.68,
        "base_elevation": 229,    # 750 ft
        "mid_elevation": _mid(229, 274),
        "peak_elevation": 274,    # 900 ft
    },
    {
        "id": "wachusett-mountain",
        "name": "Wachusett Mountain Ski Area",
        "state": "MA",
        "latitude": 42.50,
        "longitude": -71.89,
        "base_elevation": 307,    # 1,006 ft
        "mid_elevation": _mid(307, 611),
        "peak_elevation": 611,    # 2,006 ft
    },
    # ── Connecticut ───────────────────────────────────────────────────────
    {
        "id": "mohawk-mountain",
        "name": "Mohawk Mountain",
        "state": "CT",
        "latitude": 41.83,
        "longitude": -73.31,
        "base_elevation": 195,    # 640 ft
        "mid_elevation": _mid(195, 488),
        "peak_elevation": 488,    # 1,600 ft
    },
    {
        "id": "mount-southington",
        "name": "Mount Southington Ski Area",
        "state": "CT",
        "latitude": 41.60,
        "longitude": -72.88,
        "base_elevation": 91,     # 300 ft
        "mid_elevation": _mid(91, 238),
        "peak_elevation": 238,    # 780 ft
    },
    {
        "id": "powder-ridge",
        "name": "Powder Ridge Park",
        "state": "CT",
        "latitude": 41.50,
        "longitude": -72.72,
        "base_elevation": 91,     # 300 ft
        "mid_elevation": _mid(91, 219),
        "peak_elevation": 219,    # 720 ft
    },
    {
        "id": "ski-sundown",
        "name": "Ski Sundown",
        "state": "CT",
        "latitude": 41.88,
        "longitude": -72.95,
        "base_elevation": 152,    # 500 ft
        "mid_elevation": _mid(152, 335),
        "peak_elevation": 335,    # 1,100 ft
    },
    {
        "id": "woodbury-ski-area",
        "name": "Woodbury Ski Area",
        "state": "CT",
        "latitude": 41.54,
        "longitude": -73.23,
        "base_elevation": 183,    # 600 ft
        "mid_elevation": _mid(183, 262),
        "peak_elevation": 262,    # 860 ft
    },
    # ── Rhode Island ──────────────────────────────────────────────────────
    {
        "id": "yawgoo-valley",
        "name": "Yawgoo Valley",
        "state": "RI",
        "latitude": 41.55,
        "longitude": -71.60,
        "base_elevation": 46,     # 150 ft
        "mid_elevation": _mid(46, 113),
        "peak_elevation": 113,    # 370 ft
    },
    # ── New York ──────────────────────────────────────────────────────────
    {
        "id": "beartown-ski-area",
        "name": "Beartown Ski Area",
        "state": "NY",
        "latitude": 42.63,
        "longitude": -74.13,
        "base_elevation": 579,    # 1,900 ft
        "mid_elevation": _mid(579, 823),
        "peak_elevation": 823,    # 2,700 ft
    },
    {
        "id": "belleayre-mountain",
        "name": "Belleayre Mountain",
        "state": "NY",
        "latitude": 42.15,
        "longitude": -74.49,
        "base_elevation": 617,    # 2,024 ft
        "mid_elevation": _mid(617, 1045),
        "peak_elevation": 1045,   # 3,429 ft
    },
    {
        "id": "brantling",
        "name": "Brantling Ski and Snowboard Center",
        "state": "NY",
        "latitude": 43.23,
        "longitude": -77.10,
        "base_elevation": 91,     # 300 ft
        "mid_elevation": _mid(91, 198),
        "peak_elevation": 198,    # 650 ft
    },
    {
        "id": "bristol-mountain",
        "name": "Bristol Mountain",
        "state": "NY",
        "latitude": 42.73,
        "longitude": -77.40,
        "base_elevation": 366,    # 1,200 ft
        "mid_elevation": _mid(366, 671),
        "peak_elevation": 671,    # 2,200 ft
    },
    {
        "id": "buffalo-ski-club",
        "name": "Buffalo Ski Club",
        "state": "NY",
        "latitude": 42.65,
        "longitude": -78.65,
        "base_elevation": 411,    # 1,350 ft
        "mid_elevation": _mid(411, 594),
        "peak_elevation": 594,    # 1,950 ft
    },
    {
        "id": "catamount-ski-area",
        "name": "Catamount Ski Area",
        "state": "NY",
        "latitude": 42.22,
        "longitude": -73.50,
        "base_elevation": 305,    # 1,000 ft
        "mid_elevation": _mid(305, 640),
        "peak_elevation": 640,    # 2,100 ft
    },
    {
        "id": "cazenovia-ski-club",
        "name": "Cazenovia Ski Club",
        "state": "NY",
        "latitude": 42.93,
        "longitude": -75.86,
        "base_elevation": 442,    # 1,450 ft
        "mid_elevation": _mid(442, 533),
        "peak_elevation": 533,    # 1,750 ft
    },
    {
        "id": "cockaigne-ski-area",
        "name": "Cockaigne Ski Area",
        "state": "NY",
        "latitude": 42.30,
        "longitude": -79.09,
        "base_elevation": 457,    # 1,500 ft
        "mid_elevation": _mid(457, 640),
        "peak_elevation": 640,    # 2,100 ft
    },
    {
        "id": "dry-hill-ski-area",
        "name": "Dry Hill Ski Area",
        "state": "NY",
        "latitude": 44.01,
        "longitude": -75.93,
        "base_elevation": 213,    # 700 ft
        "mid_elevation": _mid(213, 366),
        "peak_elevation": 366,    # 1,200 ft
    },
    {
        "id": "four-seasons-ski",
        "name": "Four Seasons Golf and Ski Center",
        "state": "NY",
        "latitude": 42.69,
        "longitude": -74.97,
        "base_elevation": 396,    # 1,300 ft
        "mid_elevation": _mid(396, 579),
        "peak_elevation": 579,    # 1,900 ft
    },
    {
        "id": "gore-mountain",
        "name": "Gore Mountain",
        "state": "NY",
        "latitude": 43.67,
        "longitude": -74.00,
        "base_elevation": 335,    # 1,100 ft
        "mid_elevation": _mid(335, 1092),
        "peak_elevation": 1092,   # 3,583 ft
    },
    {
        "id": "greek-peak",
        "name": "Greek Peak",
        "state": "NY",
        "latitude": 42.51,
        "longitude": -76.18,
        "base_elevation": 335,    # 1,100 ft
        "mid_elevation": _mid(335, 640),
        "peak_elevation": 640,    # 2,100 ft
    },
    {
        "id": "hickory-ski-center",
        "name": "Hickory Ski Center",
        "state": "NY",
        "latitude": 43.58,
        "longitude": -73.83,
        "base_elevation": 366,    # 1,200 ft
        "mid_elevation": _mid(366, 579),
        "peak_elevation": 579,    # 1,900 ft
    },
    {
        "id": "holiday-mountain",
        "name": "Holiday Mountain",
        "state": "NY",
        "latitude": 41.61,
        "longitude": -74.78,
        "base_elevation": 335,    # 1,100 ft
        "mid_elevation": _mid(335, 515),
        "peak_elevation": 515,    # 1,690 ft
    },
    {
        "id": "holiday-valley",
        "name": "Holiday Valley",
        "state": "NY",
        "latitude": 42.28,
        "longitude": -78.67,
        "base_elevation": 457,    # 1,500 ft
        "mid_elevation": _mid(457, 708),
        "peak_elevation": 708,    # 2,323 ft
    },
    {
        "id": "holimont",
        "name": "HoliMont",
        "state": "NY",
        "latitude": 42.27,
        "longitude": -78.72,
        "base_elevation": 472,    # 1,550 ft
        "mid_elevation": _mid(472, 671),
        "peak_elevation": 671,    # 2,200 ft
    },
    {
        "id": "hunt-hollow",
        "name": "Hunt Hollow Ski Club",
        "state": "NY",
        "latitude": 42.65,
        "longitude": -77.38,
        "base_elevation": 472,    # 1,550 ft
        "mid_elevation": _mid(472, 663),
        "peak_elevation": 663,    # 2,175 ft
    },
    {
        "id": "hunter-mountain",
        "name": "Hunter Mountain",
        "state": "NY",
        "latitude": 42.18,
        "longitude": -74.23,
        "base_elevation": 488,    # 1,600 ft
        "mid_elevation": _mid(488, 975),
        "peak_elevation": 975,    # 3,200 ft
    },
    {
        "id": "kissing-bridge",
        "name": "Kissing Bridge",
        "state": "NY",
        "latitude": 42.59,
        "longitude": -78.71,
        "base_elevation": 363,    # 1,190 ft
        "mid_elevation": _mid(363, 600),
        "peak_elevation": 600,    # 1,970 ft
    },
    {
        "id": "labrador-mountain",
        "name": "Labrador Mountain",
        "state": "NY",
        "latitude": 42.66,
        "longitude": -75.99,
        "base_elevation": 488,    # 1,600 ft
        "mid_elevation": _mid(488, 698),
        "peak_elevation": 698,    # 2,290 ft
    },
    {
        "id": "maple-ski-ridge",
        "name": "Maple Ski Ridge",
        "state": "NY",
        "latitude": 42.82,
        "longitude": -74.10,
        "base_elevation": 274,    # 900 ft
        "mid_elevation": _mid(274, 381),
        "peak_elevation": 381,    # 1,250 ft
    },
    {
        "id": "mccauley-mountain",
        "name": "McCauley Mountain",
        "state": "NY",
        "latitude": 43.71,
        "longitude": -74.93,
        "base_elevation": 479,    # 1,570 ft
        "mid_elevation": _mid(479, 785),
        "peak_elevation": 785,    # 2,575 ft
    },
    {
        "id": "mount-pisgah",
        "name": "Mount Pisgah",
        "state": "NY",
        "latitude": 44.31,
        "longitude": -74.13,
        "base_elevation": 549,    # 1,800 ft
        "mid_elevation": _mid(549, 732),
        "peak_elevation": 732,    # 2,400 ft
    },
    {
        "id": "mt-peter",
        "name": "Mt. Peter Ski Area",
        "state": "NY",
        "latitude": 41.27,
        "longitude": -74.28,
        "base_elevation": 274,    # 900 ft
        "mid_elevation": _mid(274, 386),
        "peak_elevation": 386,    # 1,265 ft
    },
    {
        "id": "oak-mountain",
        "name": "Oak Mountain Ski Center",
        "state": "NY",
        "latitude": 43.51,
        "longitude": -74.38,
        "base_elevation": 472,    # 1,550 ft
        "mid_elevation": _mid(472, 729),
        "peak_elevation": 729,    # 2,390 ft
    },
    {
        "id": "peekn-peak",
        "name": "Peek'n Peak Resort",
        "state": "NY",
        "latitude": 42.12,
        "longitude": -79.36,
        "base_elevation": 430,    # 1,410 ft
        "mid_elevation": _mid(430, 535),
        "peak_elevation": 535,    # 1,755 ft
    },
    {
        "id": "plattekill",
        "name": "Plattekill",
        "state": "NY",
        "latitude": 42.29,
        "longitude": -74.59,
        "base_elevation": 640,    # 2,100 ft
        "mid_elevation": _mid(640, 1067),
        "peak_elevation": 1067,   # 3,500 ft
    },
    {
        "id": "polar-peak",
        "name": "Polar Peak Ski Bowl",
        "state": "NY",
        "latitude": 44.30,
        "longitude": -74.50,
        "base_elevation": 488,    # 1,600 ft
        "mid_elevation": _mid(488, 671),
        "peak_elevation": 671,    # 2,200 ft
    },
    {
        "id": "royal-mountain",
        "name": "Royal Mountain Ski Area",
        "state": "NY",
        "latitude": 43.09,
        "longitude": -74.47,
        "base_elevation": 427,    # 1,400 ft
        "mid_elevation": _mid(427, 622),
        "peak_elevation": 622,    # 2,040 ft
    },
    {
        "id": "ski-big-tupper",
        "name": "Ski Big Tupper Again",
        "state": "NY",
        "latitude": 44.23,
        "longitude": -74.38,
        "base_elevation": 488,    # 1,600 ft
        "mid_elevation": _mid(488, 832),
        "peak_elevation": 832,    # 2,730 ft
    },
    {
        "id": "ski-venture",
        "name": "Ski Venture",
        "state": "NY",
        "latitude": 43.90,
        "longitude": -75.38,
        "base_elevation": 366,    # 1,200 ft
        "mid_elevation": _mid(366, 610),
        "peak_elevation": 610,    # 2,000 ft
    },
    {
        "id": "snow-ridge",
        "name": "Snow Ridge Ski Area",
        "state": "NY",
        "latitude": 43.63,
        "longitude": -75.40,
        "base_elevation": 393,    # 1,290 ft
        "mid_elevation": _mid(393, 640),
        "peak_elevation": 640,    # 2,100 ft
    },
    {
        "id": "song-mountain",
        "name": "Song Mountain",
        "state": "NY",
        "latitude": 42.79,
        "longitude": -76.13,
        "base_elevation": 378,    # 1,240 ft
        "mid_elevation": _mid(378, 591),
        "peak_elevation": 591,    # 1,940 ft
    },
    {
        "id": "swain-resort",
        "name": "Swain Resort",
        "state": "NY",
        "latitude": 42.48,
        "longitude": -77.88,
        "base_elevation": 402,    # 1,320 ft
        "mid_elevation": _mid(402, 607),
        "peak_elevation": 607,    # 1,992 ft
    },
    {
        "id": "thunder-ridge",
        "name": "Thunder Ridge Ski Area",
        "state": "NY",
        "latitude": 41.50,
        "longitude": -73.60,
        "base_elevation": 274,    # 900 ft
        "mid_elevation": _mid(274, 427),
        "peak_elevation": 427,    # 1,400 ft
    },
    {
        "id": "titus-mountain",
        "name": "Titus Mountain",
        "state": "NY",
        "latitude": 44.76,
        "longitude": -74.23,
        "base_elevation": 251,    # 825 ft
        "mid_elevation": _mid(251, 617),
        "peak_elevation": 617,    # 2,025 ft
    },
    {
        "id": "west-mountain",
        "name": "West Mountain Ski Center",
        "state": "NY",
        "latitude": 43.32,
        "longitude": -73.63,
        "base_elevation": 259,    # 850 ft
        "mid_elevation": _mid(259, 506),
        "peak_elevation": 506,    # 1,660 ft
    },
    {
        "id": "whiteface-mountain",
        "name": "Whiteface Mountain",
        "state": "NY",
        "latitude": 44.37,
        "longitude": -73.90,
        "base_elevation": 372,    # 1,220 ft
        "mid_elevation": _mid(372, 1337),
        "peak_elevation": 1337,   # 4,386 ft
    },
    {
        "id": "willard-mountain",
        "name": "Willard Mountain",
        "state": "NY",
        "latitude": 43.12,
        "longitude": -73.48,
        "base_elevation": 213,    # 700 ft
        "mid_elevation": _mid(213, 411),
        "peak_elevation": 411,    # 1,350 ft
    },
    {
        "id": "windham-mountain",
        "name": "Windham Mountain",
        "state": "NY",
        "latitude": 42.30,
        "longitude": -74.25,
        "base_elevation": 457,    # 1,500 ft
        "mid_elevation": _mid(457, 945),
        "peak_elevation": 945,    # 3,100 ft
    },
    {
        "id": "woods-valley",
        "name": "Woods Valley Ski Area",
        "state": "NY",
        "latitude": 43.26,
        "longitude": -75.43,
        "base_elevation": 427,    # 1,400 ft
        "mid_elevation": _mid(427, 640),
        "peak_elevation": 640,    # 2,100 ft
    },
    # ── New Jersey ────────────────────────────────────────────────────────
    {
        "id": "campgaw-mountain",
        "name": "Campgaw Mountain",
        "state": "NJ",
        "latitude": 41.07,
        "longitude": -74.21,
        "base_elevation": 104,    # 340 ft
        "mid_elevation": _mid(104, 219),
        "peak_elevation": 219,    # 720 ft
    },
    {
        "id": "mountain-creek",
        "name": "Mountain Creek Resort",
        "state": "NJ",
        "latitude": 41.22,
        "longitude": -74.47,
        "base_elevation": 286,    # 940 ft
        "mid_elevation": _mid(286, 451),
        "peak_elevation": 451,    # 1,480 ft
    },
]

_RESORTS_BY_ID = {r["id"]: r for r in RESORTS}

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
FORECAST_DAYS = 16  # today + 15
HOURLY_WINDOW = 12

# Fetched at every elevation (base, mid, peak)
ELEVATION_DAILY_VARS = [
    "temperature_2m_max",
    "temperature_2m_min",
    "apparent_temperature_max",
    "apparent_temperature_min",
    "windspeed_10m_max",
    "windgusts_10m_max",
    "snowfall_sum",
    "rain_sum",
    "precipitation_sum",
]

ELEVATION_HOURLY_VARS = [
    "temperature_2m",
    "apparent_temperature",
    "windspeed_10m",
    "windgusts_10m",
    "snowfall",
    "rain",
    "precipitation",
    "snow_depth",
    "visibility",
]

# Additional variables fetched at peak only (not elevation-dependent)
PEAK_EXTRA_HOURLY_VARS = [
    "cloudcover",
    "freezinglevel_height",
]


# ── Unit helpers ───────────────────────────────────────────────────────────────

def _m_to_in(v: float | None) -> float | None:
    return round(v * 39.3701, 2) if v is not None else None

def _m_to_mi(v: float | None) -> float | None:
    return round(v / 1609.34, 1) if v is not None else None

def _m_to_ft(v: float | None) -> int | None:
    return round(v * 3.28084) if v is not None else None


# ── API fetch ─────────────────────────────────────────────────────────────────

# Standard environmental lapse rate: 6.5 °C / 1 000 m → in °F per metre
_LAPSE_RATE_F_PER_M = (6.5 / 1000.0) * 1.8  # ≈ 0.01170 °F/m


def _at_elevation(raw: dict, model_elev: float, target_elev: int) -> dict:
    """Return a copy of *raw* with temperatures shifted for *target_elev*.

    Only temperature lists are rebuilt; all other arrays are shared by reference
    to avoid deep-copying megabytes of weather data.
    """
    offset_f = (model_elev - target_elev) * _LAPSE_RATE_F_PER_M
    if abs(offset_f) <= 0.01:
        return raw

    def shift(arr: list) -> list:
        return [round(v + offset_f, 1) if v is not None else None for v in arr]

    hourly = dict(raw["hourly"])
    for var in ("temperature_2m", "apparent_temperature"):
        if var in hourly:
            hourly[var] = shift(hourly[var])

    daily = dict(raw["daily"])
    for var in (
        "temperature_2m_max", "temperature_2m_min",
        "apparent_temperature_max", "apparent_temperature_min",
    ):
        if var in daily:
            daily[var] = shift(daily[var])

    return {**raw, "hourly": hourly, "daily": daily}


async def _fetch(
    client: httpx.AsyncClient,
    lat: float,
    lon: float,
    daily_vars: list[str],
    hourly_vars: list[str],
) -> dict[str, Any]:
    """Single Open-Meteo request — no elevation override (avoids 502s).

    Callers use _at_elevation() to derive per-elevation views in memory.
    """
    params: dict[str, Any] = {
        "latitude": lat,
        "longitude": lon,
        "daily": ",".join(daily_vars),
        "hourly": ",".join(hourly_vars),
        "temperature_unit": "fahrenheit",
        "windspeed_unit": "mph",
        "precipitation_unit": "inch",
        "forecast_days": FORECAST_DAYS,
        "timezone": "auto",
    }
    response = await client.get(OPEN_METEO_URL, params=params)
    response.raise_for_status()
    return response.json()


# ── Hourly → daily aggregation helpers ────────────────────────────────────────

def _current_hour_index(data: dict[str, Any]) -> int:
    utc_offset = timedelta(seconds=data["utc_offset_seconds"])
    local_now = datetime.now(timezone.utc) + utc_offset
    current_hour_str = local_now.strftime("%Y-%m-%dT%H:00")
    times = data["hourly"]["time"]
    return next((i for i, t in enumerate(times) if t == current_hour_str), 0)


# Inches of snow depth per inch of liquid water (standard 10:1 ratio)
_SNOW_WATER_RATIO = 10.0


def _phase_correct(
    precip: float | None,
    temp_f: float | None,
) -> tuple[float, float]:
    """Return (snowfall_in, rain_in) redistributed from total precip based on temperature.

    Uses a linear blend across the 32–34 °F mixed-phase zone.
    snowfall is returned as snow depth inches (precip × snow-water ratio).
    rain is returned as liquid inches.
    """
    if not precip or temp_f is None:
        return 0.0, 0.0
    rain_frac = max(0.0, min(1.0, (temp_f - 32.0) / 2.0))
    snow_frac = 1.0 - rain_frac
    return round(precip * snow_frac * _SNOW_WATER_RATIO, 2), round(precip * rain_frac, 3)


def _daily_agg(data: dict[str, Any], var: str, fn) -> dict[str, Any]:
    """Bucket hourly values by date, apply fn to each bucket, skip Nones."""
    times = data["hourly"]["time"]
    values = data["hourly"].get(var, [])
    buckets: dict[str, list] = {}
    for t, v in zip(times, values):
        if v is not None:
            buckets.setdefault(t[:10], []).append(v)
    return {date: fn(vals) for date, vals in buckets.items()}


def _elevation_days(data: dict[str, Any]) -> dict[str, dict[str, Any]]:
    d = data["daily"]
    # Aggregate hourly-only variables to daily
    snow_depth_max = _daily_agg(data, "snow_depth", lambda v: _m_to_in(max(v)))
    visibility_min = _daily_agg(data, "visibility", lambda v: _m_to_mi(min(v)))

    result = {}
    for i, date in enumerate(d["time"]):
        hi, lo = d["temperature_2m_max"][i], d["temperature_2m_min"][i]
        mean_temp = (hi + lo) / 2 if hi is not None and lo is not None else None
        snowfall, rain = _phase_correct(d["precipitation_sum"][i], mean_temp)
        result[date] = {
            "high_f":            d["temperature_2m_max"][i],
            "low_f":             d["temperature_2m_min"][i],
            "apparent_high_f":   d["apparent_temperature_max"][i],
            "apparent_low_f":    d["apparent_temperature_min"][i],
            "max_windspeed_mph": d["windspeed_10m_max"][i],
            "max_windgusts_mph": d["windgusts_10m_max"][i],
            "snowfall_in":       snowfall,
            "rain_in":           rain,
            "precipitation_in":  d["precipitation_sum"][i],
            "max_snow_depth_in": snow_depth_max.get(date),
            "min_visibility_mi": visibility_min.get(date),
        }
    return result


def _hourly_elevation_snapshot(data: dict[str, Any], idx: int) -> dict[str, Any]:
    h = data["hourly"]
    temp = h["temperature_2m"][idx]
    snowfall, rain = _phase_correct(h["precipitation"][idx], temp)
    return {
        "temperature_f":          temp,
        "apparent_temperature_f": h["apparent_temperature"][idx],
        "windspeed_mph":          h["windspeed_10m"][idx],
        "windgusts_mph":          h["windgusts_10m"][idx],
        "snowfall_in":            snowfall,
        "rain_in":                rain,
        "precipitation_in":       h["precipitation"][idx],
        "snow_depth_in":          _m_to_in(h["snow_depth"][idx]),
        "visibility_mi":          _m_to_mi(h["visibility"][idx]),
    }


# ── Main fetch ────────────────────────────────────────────────────────────────

async def fetch_resort_conditions(resort: dict[str, Any]) -> dict[str, Any]:
    lat, lon = resort["latitude"], resort["longitude"]
    all_hourly = ELEVATION_HOURLY_VARS + PEAK_EXTRA_HOURLY_VARS

    async with httpx.AsyncClient(timeout=30.0) as client:
        raw = await _fetch(client, lat, lon, ELEVATION_DAILY_VARS, all_hourly)

    model_elev: float = raw.get("elevation", resort["mid_elevation"])
    base_data = _at_elevation(raw, model_elev, resort["base_elevation"])
    mid_data  = _at_elevation(raw, model_elev, resort["mid_elevation"])
    peak_data = _at_elevation(raw, model_elev, resort["peak_elevation"])

    base_days = _elevation_days(base_data)
    mid_days  = _elevation_days(mid_data)
    peak_days = _elevation_days(peak_data)

    # Cloud cover and freezing level: top-level, not elevation-specific
    cloud_cover_by_date   = _daily_agg(peak_data, "cloudcover",          lambda v: round(sum(v) / len(v)))
    freezing_level_by_date = _daily_agg(peak_data, "freezinglevel_height", lambda v: _m_to_ft(sum(v) / len(v)))

    dates = peak_data["daily"]["time"]

    forecast = [
        {
            "date": date,
            "cloud_cover_avg_pct":    cloud_cover_by_date.get(date, 0),
            "avg_freezing_level_ft":  freezing_level_by_date.get(date),
            "base": {"elevation_ft": round(resort["base_elevation"] * 3.28084), **base_days[date]},
            "mid":  {"elevation_ft": round(resort["mid_elevation"]  * 3.28084), **mid_days[date]},
            "peak": {"elevation_ft": round(resort["peak_elevation"] * 3.28084), **peak_days[date]},
        }
        for i, date in enumerate(dates)
    ]

    start  = _current_hour_index(peak_data)
    peak_h = peak_data["hourly"]
    times  = peak_h["time"]

    next_12_hours = [
        {
            "time":               times[idx],
            "cloud_cover_pct":    peak_h["cloudcover"][idx],
            "freezing_level_ft":  _m_to_ft(peak_h["freezinglevel_height"][idx]),
            "base": {"elevation_ft": round(resort["base_elevation"] * 3.28084), **_hourly_elevation_snapshot(base_data, idx)},
            "mid":  {"elevation_ft": round(resort["mid_elevation"]  * 3.28084), **_hourly_elevation_snapshot(mid_data,  idx)},
            "peak": {"elevation_ft": round(resort["peak_elevation"] * 3.28084), **_hourly_elevation_snapshot(peak_data, idx)},
        }
        for idx in range(start, start + HOURLY_WINDOW)
    ]

    return {
        "resort":        resort["name"],
        "state":         resort["state"],
        "next_12_hours": next_12_hours,
        "forecast":      forecast,
    }


def get_all_resort_metadata() -> list[dict[str, Any]]:
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "state": r["state"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "base_elevation_ft": round(r["base_elevation"] * 3.28084),
            "mid_elevation_ft": round(r["mid_elevation"] * 3.28084),
            "peak_elevation_ft": round(r["peak_elevation"] * 3.28084),
        }
        for r in RESORTS
    ]


async def fetch_conditions_by_id(resort_id: str) -> dict[str, Any] | None:
    resort = _RESORTS_BY_ID.get(resort_id)
    if resort is None:
        return None
    return await fetch_resort_conditions(resort)


async def fetch_all_conditions() -> list[dict[str, Any]]:
    tasks = [fetch_resort_conditions(resort) for resort in RESORTS]
    return await asyncio.gather(*tasks)
