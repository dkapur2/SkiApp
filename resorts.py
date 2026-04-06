import asyncio
import httpx
from datetime import datetime, timezone, timedelta
from typing import Any

RESORTS = [
    {
        "id": "snowshoe",
        "name": "Snowshoe",
        "latitude": 38.4023,
        "longitude": -79.9939,
        "base_elevation": 1020,   # 3,348 ft
        "mid_elevation": 1249,    # ~4,098 ft (midpoint)
        "peak_elevation": 1478,   # 4,848 ft
    },
    {
        "id": "jay-peak",
        "name": "Jay Peak",
        "latitude": 44.9256,
        "longitude": -72.5120,
        "base_elevation": 533,    # 1,750 ft
        "mid_elevation": 855,     # ~2,805 ft (midpoint)
        "peak_elevation": 1177,   # 3,862 ft
    },
    {
        "id": "liberty",
        "name": "Liberty",
        "latitude": 39.7954,
        "longitude": -77.3994,
        "base_elevation": 174,    # 570 ft
        "mid_elevation": 269,     # ~883 ft (midpoint)
        "peak_elevation": 363,    # 1,190 ft
    },
    {
        "id": "whitetail",
        "name": "Whitetail",
        "latitude": 39.7360,
        "longitude": -77.8990,
        "base_elevation": 264,    # 865 ft
        "mid_elevation": 407,     # ~1,335 ft (midpoint)
        "peak_elevation": 549,    # 1,800 ft
    },
    {
        "id": "stowe",
        "name": "Stowe",
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
    """Average hourly cloudcover into one value per date."""
    times = data["hourly"]["time"]
    values = data["hourly"]["cloudcover"]
    buckets: dict[str, list[int]] = {}
    for t, v in zip(times, values):
        date = t[:10]
        buckets.setdefault(date, []).append(v)
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

    # --- daily forecast ---
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

    # --- next 12 hours ---
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
        "next_12_hours": next_12_hours,
        "forecast": forecast,
    }


def get_all_resort_metadata() -> list[dict[str, Any]]:
    return [
        {
            "id": r["id"],
            "name": r["name"],
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
