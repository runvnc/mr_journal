from lib.pipelines.pipe import pipe
from datetime import datetime

def format_journal_entries(entries) -> str:
    # Sort entries by timestamp (oldest first for chronological order)
    sorted_entries = sorted(entries, key=lambda x: x['timestamp'])
    
    # Calculate total characters and select entries within limit
    MAX_CHARS = 60000  # About 30 pages
    total_chars = 0
    selected_entries = []
    
    for entry in sorted_entries:
        entry_text = f"\n--- Journal Entry {datetime.fromtimestamp(entry['timestamp']/1000).strftime('%Y-%m-%d %H:%M:%S')} ---\n{entry['content']}\n"
        entry_chars = len(entry_text)
        
        if total_chars + entry_chars <= MAX_CHARS:
            selected_entries.append(entry_text)
            total_chars += entry_chars
        else:
            break
    
    return "\n\n### Journal Entries ###\n" + ''.join(selected_entries) if selected_entries else ""

@pipe(name='filter_messages', priority=5)
def add_journal_entries(data: dict, context=None) -> dict:
    """
    Add journal entries to the end of the first message's content.
    Entries are added in chronological order, limited to ~30 pages of text.
    """
    try:
        if not data.get('messages') or len(data['messages']) == 0:
            return None

        # Get journal entries from the context
        if not hasattr(context, 'journal_entries'):
            return None

        entries = context.journal_entries
        if not entries:
            return None

        # Format entries and add to first message
        formatted_entries = format_journal_entries(entries)
        if formatted_entries:
            first_msg = data['messages'][0]
            if isinstance(first_msg.get('content'), str):
                first_msg['content'] = first_msg['content'] + formatted_entries
            elif isinstance(first_msg.get('content'), dict) and first_msg['content'].get('type') == 'text':
                first_msg['content']['text'] = first_msg['content']['text'] + formatted_entries
            elif isinstance(first_msg.get('content'), list):
                first_msg['content'].append({"type": "text", "text": formatted_entries})

        return None

    except Exception as e:
        print(f"Error in add_journal_entries pipe: {str(e)}")
        return None
