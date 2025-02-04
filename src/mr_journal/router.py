from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from lib.templates import render
import os
import json
from datetime import datetime
from uuid import uuid4

router = APIRouter()

@router.get("/journal", response_class=HTMLResponse)
async def journal_page(request: Request):
    # Use the rendering mechanism from the framework to allow for plugin injection/override
    user = request.state.user if hasattr(request.state, "user") else {"username": "guest"}
    html = await render("journal", {"request": request, "user": user})
    return HTMLResponse(html)

@router.get("/journal/entries", response_class=JSONResponse)
async def get_journal_entries(request: Request):
    # Retrieve entries only for the authenticated user
    user = request.state.user.username if hasattr(request.state, "user") and hasattr(request.state.user, "username") else "guest"
    base_dir = os.path.join("data", user, "journal")
    entries = []
    if not os.path.exists(base_dir):
        return JSONResponse(entries)
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith(".json"):
                filepath = os.path.join(root, file)
                with open(filepath, "r") as f:
                    try:
                        entry = json.load(f)
                        entries.append(entry)
                    except Exception:
                        continue
    entries.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    return JSONResponse(entries)

@router.post("/journal/entry", response_class=JSONResponse)
async def save_journal_entry(request: Request):
    # Save entry for the authenticated user
    user = request.state.user.username if hasattr(request.state, "user") and hasattr(request.state.user, "username") else "guest"
    data = await request.json()
    timestamp = data.get("timestamp", None)
    if timestamp is None:
        timestamp = int(datetime.now().timestamp() * 1000)
    else:
        timestamp = int(timestamp)
    entry_id = data.get("id", str(uuid4()))
    entry = {
        "id": entry_id,
        "timestamp": timestamp,
        "content": data.get("content", ""),
        "tags": data.get("tags", []),
        "title": data.get("title", "")
    }

    def get_journal_dir(username, timestamp):
        now = datetime.fromtimestamp(timestamp / 1000)
        folder = now.strftime("%Y-%m")
        path = os.path.join("data", username, "journal", folder)
        os.makedirs(path, exist_ok=True)
        return path

    dir_path = get_journal_dir(user, timestamp)
    filename = f"entry_{entry_id}.json"
    filepath = os.path.join(dir_path, filename)
    with open(filepath, "w") as f:
        json.dump(entry, f)
    return JSONResponse(entry)

@router.delete("/journal/entry/{entry_id}", response_class=JSONResponse)
async def delete_journal_entry(request: Request, entry_id: str):
    user = request.state.user.username if hasattr(request.state, "user") and hasattr(request.state.user, "username") else "guest"
    base_dir = os.path.join("data", user, "journal")
    deleted = False
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.startswith(f"entry_{entry_id}") and file.endswith(".json"):
                os.remove(os.path.join(root, file))
                deleted = True
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found")
    return JSONResponse({"status": "deleted"})
