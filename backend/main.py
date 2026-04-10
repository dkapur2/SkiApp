import asyncio
import os
import traceback
import anthropic
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from resorts import RESORTS, fetch_conditions_by_id, fetch_resort_conditions, get_all_resort_metadata

app = FastAPI(title="Ski Resort Conditions API")


async def _warm_cache():
    """Pre-fetch every resort into the cache on startup, one every 2 s.

    Slow enough to stay well under Open-Meteo's free-tier rate limit while
    still warming all 158 resorts within ~5 minutes of startup.
    """
    for resort in RESORTS:
        try:
            await fetch_resort_conditions(resort)
        except Exception:
            pass  # failed resorts will be retried on first user click
        await asyncio.sleep(2.0)


@app.on_event("startup")
async def startup():
    asyncio.create_task(_warm_cache())

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dkapur.com",
        "https://www.dkapur.com",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/resorts/conditions")
async def list_resorts():
    return get_all_resort_metadata()


@app.get("/resorts/{resort_id}/conditions")
async def get_resort_conditions(resort_id: str):
    try:
        conditions = await fetch_conditions_by_id(resort_id)
    except Exception as e:
        traceback.print_exc()   # full stack trace → Railway logs
        raise HTTPException(status_code=502, detail=f"{type(e).__name__}: {e}")
    if conditions is None:
        raise HTTPException(status_code=404, detail=f"Resort '{resort_id}' not found")
    return conditions


class ResortConditions(BaseModel):
    resort_name: str
    snow_depth_in: float | None = None
    temperature_f: float | None = None
    wind_speed_mph: float | None = None
    crowd_level: str | None = None  # e.g. "low", "moderate", "high"


@app.post("/recommend")
async def recommend(conditions: ResortConditions):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    parts = [f"Resort: {conditions.resort_name}"]
    if conditions.snow_depth_in is not None:
        parts.append(f"Snow depth: {conditions.snow_depth_in} inches")
    if conditions.temperature_f is not None:
        parts.append(f"Temperature: {conditions.temperature_f}°F")
    if conditions.wind_speed_mph is not None:
        parts.append(f"Wind speed: {conditions.wind_speed_mph} mph")
    if conditions.crowd_level is not None:
        parts.append(f"Crowd level: {conditions.crowd_level}")

    user_message = "\n".join(parts)

    client = anthropic.Anthropic(api_key=api_key)
    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            system=(
                "You are a ski resort advisor. Given current conditions at a resort, "
                "provide a concise 2-3 sentence recommendation on whether the resort "
                "is worth visiting and why. Be direct and practical."
            ),
            messages=[{"role": "user", "content": user_message}],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Anthropic API error: {e}")

    recommendation = message.content[0].text
    return {"recommendation": recommendation}


_FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../frontend")
app.mount("/", StaticFiles(directory=_FRONTEND_DIR, html=True), name="static")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
