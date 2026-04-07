import asyncio
import os
import traceback
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from resorts import RESORTS, fetch_conditions_by_id, fetch_resort_conditions, get_all_resort_metadata

app = FastAPI(title="Ski Resort Conditions API")


async def _warm_cache():
    """Pre-fetch every resort into the cache on startup, one every 0.5 s."""
    for resort in RESORTS:
        try:
            await fetch_resort_conditions(resort)
        except Exception:
            pass  # failed resorts will be retried on first user click
        await asyncio.sleep(0.5)


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


_FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../frontend")
app.mount("/", StaticFiles(directory=_FRONTEND_DIR, html=True), name="static")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
