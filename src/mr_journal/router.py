from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from lib.templates import render
from loguru import logger
from .utils.journal_utils import get_journal_entries, save_journal_entry, delete_journal_entry

router = APIRouter()

@router.get("/journal", response_class=HTMLResponse)
async def journal_page(request: Request):
    # Use the rendering mechanism from the framework to allow for plugin injection/override
    user = request.state.user if hasattr(request.state, "user") else {"username": "guest"}
    html = await render("journal", {"request": request, "user": user})
    return HTMLResponse(html)

@router.get("/journal/entries", response_class=JSONResponse)
async def get_journal_entries_route(request: Request):
    # Retrieve entries only for the authenticated user
    user = request.state.user.username if hasattr(request.state, "user") and hasattr(request.state.user, "username") else "guest"
    entries = get_journal_entries(user)
    return JSONResponse(entries)

@router.post("/journal/entry", response_class=JSONResponse)
async def save_journal_entry_route(request: Request):
    try:
        # Save entry for the authenticated user
        user = request.state.user.username if hasattr(request.state, "user") and hasattr(request.state.user, "username") else "guest"
        data = await request.json()
        entry = save_journal_entry(user, data)
        return JSONResponse(entry)
    except Exception as e:
        logger.error(f"Error saving journal entry: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save journal entry")

@router.delete("/journal/entry/{entry_id}", response_class=JSONResponse)
async def delete_journal_entry_route(request: Request, entry_id: str):
    try:
        user = request.state.user.username if hasattr(request.state, "user") and hasattr(request.state.user, "username") else "guest"
        deleted = delete_journal_entry(user, entry_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Entry not found")
        return JSONResponse({"status": "deleted"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting journal entry: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete journal entry")
