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
        "id": "stowe",
        "name": "Stowe",
        "state": "VT",
        "latitude": 44.5303,
        "longitude": -72.7814,
        "base_elevation": 390,    # 1,280 ft
        "mid_elevation": 1105,    # 3,625 ft (official Spruce Peak skiing top)
        "peak_elevation": 1340,   # 4,395 ft (Mt. Mansfield summit)
    },
]

_RESORTS_BY_ID = {r["id"]: r for r in RESORTS}

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
FORECAST_DAYS = 16  # today + 15
HOURLY_WINDOW = 12

ELEVATION_DAILY_VARS = [
    "temperature_2m_max",
    "temperature_2m_min",
    "windspeed_10m_max",
    "windgusts_10m_max",
]

PEAK_EXTRA_DAILY_VARS = [
    "snowfall_sum",
    "precipitation_sum",
]

ELEVATION_HOURLY_VARS = [
    "temperature_2m",
    "windspeed_10m",
    "windgusts_10m",
]

PEAK_EXTRA_HOURLY_VARS = [
    "snowfall",
    "precipitation",
    "cloudcover",
]


async def _fetch(
    client: httpx.AsyncClient,
    lat: float,
    lon: float,
    elevation: int,
    daily_vars: list[str],
    hourly_vars: list[str],
) -> dict[str, Any]:
    params: dict[str, Any] = {
        "latitude": lat,
        "longitude": lon,
        "elevation": elevation,
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


def _current_hour_index(data: dict[str, Any]) -> int:
    utc_offset = timedelta(seconds=data["utc_offset_seconds"])
    local_now = datetime.now(timezone.utc) + utc_offset
    current_hour_str = local_now.strftime("%Y-%m-%dT%H:00")
    times = data["hourly"]["time"]
    return next((i for i, t in enumerate(times) if t == current_hour_str), 0)


def _daily_cloud_cover_avgs(data: dict[str, Any]) -> dict[str, int]:
    times = data["hourly"]["time"]
    values = data["hourly"]["cloudcover"]
    buckets: dict[str, list[int]] = {}
    for t, v in zip(times, values):
        if v is not None:
            buckets.setdefault(t[:10], []).append(v)
    return {date: round(sum(vals) / len(vals)) for date, vals in buckets.items()}


def _elevation_days(data: dict[str, Any]) -> dict[str, dict[str, Any]]:
    d = data["daily"]
    return {
        date: {
            "high_f": d["temperature_2m_max"][i],
            "low_f": d["temperature_2m_min"][i],
            "max_windspeed_mph": d["windspeed_10m_max"][i],
            "max_windgusts_mph": d["windgusts_10m_max"][i],
        }
        for i, date in enumerate(d["time"])
    }


def _hourly_elevation_snapshot(data: dict[str, Any], idx: int) -> dict[str, Any]:
    h = data["hourly"]
    return {
        "temperature_f": h["temperature_2m"][idx],
        "windspeed_mph": h["windspeed_10m"][idx],
        "windgusts_mph": h["windgusts_10m"][idx],
    }


async def fetch_resort_conditions(resort: dict[str, Any]) -> dict[str, Any]:
    lat, lon = resort["latitude"], resort["longitude"]
    peak_daily = ELEVATION_DAILY_VARS + PEAK_EXTRA_DAILY_VARS
    peak_hourly = ELEVATION_HOURLY_VARS + PEAK_EXTRA_HOURLY_VARS

    async with httpx.AsyncClient(timeout=15.0) as client:
        base_data, mid_data, peak_data = await asyncio.gather(
            _fetch(client, lat, lon, resort["base_elevation"], ELEVATION_DAILY_VARS, ELEVATION_HOURLY_VARS),
            _fetch(client, lat, lon, resort["mid_elevation"], ELEVATION_DAILY_VARS, ELEVATION_HOURLY_VARS),
            _fetch(client, lat, lon, resort["peak_elevation"], peak_daily, peak_hourly),
        )

    cloud_cover_by_date = _daily_cloud_cover_avgs(peak_data)
    base_days = _elevation_days(base_data)
    mid_days = _elevation_days(mid_data)
    peak_days = _elevation_days(peak_data)

    peak_d = peak_data["daily"]
    dates = peak_d["time"]

    forecast = [
        {
            "date": date,
            "snowfall_in": peak_d["snowfall_sum"][i],
            "precipitation_in": peak_d["precipitation_sum"][i],
            "cloud_cover_avg_pct": cloud_cover_by_date.get(date, 0),
            "base": {
                "elevation_ft": round(resort["base_elevation"] * 3.28084),
                **base_days[date],
            },
            "mid": {
                "elevation_ft": round(resort["mid_elevation"] * 3.28084),
                **mid_days[date],
            },
            "peak": {
                "elevation_ft": round(resort["peak_elevation"] * 3.28084),
                **peak_days[date],
            },
        }
        for i, date in enumerate(dates)
    ]

    start = _current_hour_index(peak_data)
    peak_h = peak_data["hourly"]
    times = peak_h["time"]

    next_12_hours = [
        {
            "time": times[idx],
            "snowfall_in": peak_h["snowfall"][idx],
            "precipitation_in": peak_h["precipitation"][idx],
            "cloud_cover_pct": peak_h["cloudcover"][idx],
            "base": {
                "elevation_ft": round(resort["base_elevation"] * 3.28084),
                **_hourly_elevation_snapshot(base_data, idx),
            },
            "mid": {
                "elevation_ft": round(resort["mid_elevation"] * 3.28084),
                **_hourly_elevation_snapshot(mid_data, idx),
            },
            "peak": {
                "elevation_ft": round(resort["peak_elevation"] * 3.28084),
                **_hourly_elevation_snapshot(peak_data, idx),
            },
        }
        for idx in range(start, start + HOURLY_WINDOW)
    ]

    return {
        "resort": resort["name"],
        "state": resort["state"],
        "next_12_hours": next_12_hours,
        "forecast": forecast,
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
