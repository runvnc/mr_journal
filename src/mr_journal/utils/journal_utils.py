import os
import json
from datetime import datetime, timezone
from typing import List, Dict, Optional
from loguru import logger
from uuid import uuid4

def get_journal_dir(username: str, timestamp: Optional[int] = None) -> str:
    if timestamp is None:
        now = datetime.now(timezone.utc)
    else:
        now = datetime.fromtimestamp(timestamp/1000, timezone.utc)  # timestamp in ms
    folder = now.strftime("%Y-%m")
    path = os.path.join("data", username, "journal", folder)
    os.makedirs(path, exist_ok=True)
    return path

def get_journal_entries(username: str) -> List[Dict]:
    base_dir = os.path.join("data", username, "journal")
    entries = []
    if not os.path.exists(base_dir):
        return entries
    
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith(".json"):
                filepath = os.path.join(root, file)
                with open(filepath, "r") as f:
                    try:
                        entry = json.load(f)
                        entries.append(entry)
                    except Exception as e:
                        logger.warning(f"Failed to load journal entry {filepath}: {str(e)}")
                        continue
    
    entries.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    return entries

def save_journal_entry(username: str, data: Dict) -> Dict:
    timestamp = data.get("timestamp", None)
    if timestamp is None:
        timestamp = int(datetime.now(timezone.utc).timestamp() * 1000)
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

    dir_path = get_journal_dir(username, timestamp)
    filename = f"entry_{entry_id}.json"
    filepath = os.path.join(dir_path, filename)
    
    try:
        with open(filepath, "w") as f:
            json.dump(entry, f)
        return entry
    except Exception as e:
        logger.error(f"Failed to save journal entry to {filepath}: {str(e)}")
        raise

def delete_journal_entry(username: str, entry_id: str) -> bool:
    base_dir = os.path.join("data", username, "journal")
    deleted = False
    
    try:
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                if file.startswith(f"entry_{entry_id}") and file.endswith(".json"):
                    filepath = os.path.join(root, file)
                    os.remove(filepath)
                    deleted = True
        return deleted
    except Exception as e:
        logger.error(f"Failed to delete journal entry {entry_id}: {str(e)}")
        raise

def format_journal_entries(entries: List[Dict]) -> str:
    # Sort entries by timestamp (oldest first for chronological order)
    sorted_entries = sorted(entries, key=lambda x: x['timestamp'])
    
    # Calculate total characters and select entries within limit
    MAX_CHARS = 60000  # About 30 pages
    total_chars = 0
    selected_entries = []
    
    for entry in sorted_entries:
        entry_text = f"\n--- Journal Entry {datetime.fromtimestamp(entry['timestamp']/1000, timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')} ---\n{entry['content']}\n"
        entry_chars = len(entry_text)
        
        if total_chars + entry_chars <= MAX_CHARS:
            selected_entries.append(entry_text)
            total_chars += entry_chars
        else:
            logger.warning(f"Journal entries truncated at {len(selected_entries)} entries due to size limit")
            break
    
    return "\n\n# Journal\n\n### Journal Entries ###\n" + ''.join(selected_entries) if selected_entries else ""
