from lib.pipelines.pipe import pipe
from .utils.journal_utils import get_journal_entries, format_journal_entries
from loguru import logger

@pipe(name='filter_messages', priority=5)
def add_journal_entries(data: dict, context=None) -> dict:
    """
    Add journal entries to the end of the first message's content.
    Entries are added in chronological order, limited to ~30 pages of text.
    """
    try:
        if not data.get('messages') or len(data['messages']) == 0:
            logger.warning("No messages found in data for adding journal entries")
            return None

        # Get username from context
        if not hasattr(context, 'username'):
            logger.warning("No username found in context for journal entries")
            return None
            
        # Get journal entries using the utility function
        entries = get_journal_entries(context.username)
        if not entries:
            logger.info(f"No journal entries found for user {context.username}")
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
            else:
                logger.warning(f"Unexpected message content format: {type(first_msg.get('content'))}")

        return None

    except Exception as e:
        logger.error(f"Error in add_journal_entries pipe: {str(e)}")
        return None
