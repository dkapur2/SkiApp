from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from resorts import fetch_conditions_by_id, get_all_resort_metadata

app = FastAPI(title="Ski Resort Conditions API")


@app.get("/resorts/conditions")
async def list_resorts():
    return get_all_resort_metadata()


@app.get("/resorts/{resort_id}/conditions")
async def get_resort_conditions(resort_id: str):
    try:
        conditions = await fetch_conditions_by_id(resort_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch conditions: {e}")
    if conditions is None:
        raise HTTPException(status_code=404, detail=f"Resort '{resort_id}' not found")
    return conditions


app.mount("/", StaticFiles(directory="static", html=True), name="static")
