import { LitElement, html, css } from '/chat/static/js/lit-core.min.js';
import { BaseEl } from '/chat/static/js/base.js';
import './tags-input.js';

class JournalApp extends BaseEl {
  static properties = {
    username: { type: String },
    entries: { type: Array },
    availableTags: { type: Array },
    currentContent: { type: String },
    currentTags: { type: Array },
    currentTimestamp: { type: Number }
  };

  static styles = css`
    :host { 
      display: block; 
      background-color: #101020; 
      color: #f0f0f0; 
      padding: 15px; 
      font-family: ui-sans-serif, -apple-system, system-ui, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif;
    }
    .container { display: flex; }
    .sidebar { 
      width: 30%; 
      border-right: 1px solid #333; 
      padding-right: 10px;
      overflow-y: auto;
      max-height: 90vh;
    }
    .editor { 
      width: 70%; 
      padding-left: 10px;
      overflow-y: auto;
      max-height: 90vh;
    }
    .entry { 
      margin-bottom: 10px; 
      padding: 8px; 
      border: 1px solid #333; 
      border-radius: 8px; 
      cursor: pointer;
      background-color: #1a1a1a;
      transition: all 0.2s ease;
    }
    .entry:hover { 
      background-color: #2d3748;
      transform: translateX(2px);
    }
    input, textarea {
      width: 100%;
      margin: 5px 0;
      padding: 10px;
      border: 1px solid #333;
      border-radius: 8px;
      background-color: #101020;
      color: #f0f0f0;
      font-family: inherit;
    }
    textarea {
      resize: vertical;
      min-height: 150px;
    }
    button {
      background: linear-gradient(145deg, #4a5eff, #2e41e3);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      font-weight: 500;
      cursor: pointer;
      margin-right: 8px;
      transition: all 0.2s ease-in-out;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      background: linear-gradient(145deg, #5a6eff, #3e51f3);
    }
    .new-button {
      background: linear-gradient(145deg, #4CAF50, #45a049);
      color: white;
      font-weight: bold;
      margin-bottom: 15px;
      width: 100%;
    }
    .new-button:hover {
      background: linear-gradient(145deg, #5dbf61, #4caf50);
    }
    .char-count {
      font-size: 0.8em;
      color: #aaa;
      margin-top: 4px;
    }
    .char-count.near-limit {
      color: #ffaa00;
    }
    .char-count.at-limit {
      color: #ff4444;
    }
    tags-input {
      margin: 5px 0;
    }
    /* Scrollbar styles */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #101020;
    }
    ::-webkit-scrollbar-thumb {
      background-color: #333;
      border-radius: 10px;
      border: 2px solid #101020;
    }
    * {
      scrollbar-width: thin;
      scrollbar-color: #333 #101020;
    }
  `;

  constructor() {
    super();
    this.username = window.currentUser || 'guest';
    this.entries = [];
    this.availableTags = [];
    this._currentEntry = null;
    this.currentContent = '';
    this.currentTags = [];
    this.currentTimestamp = Date.now();
    this.MAX_CHARS = 2000;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadEntries();
  }

  async loadEntries() {
    try {
      const response = await fetch(`/journal/entries`);
      this.entries = await response.json();
      console.log({entries: this.entries});
      this.computeAvailableTags();
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    }
  }

  computeAvailableTags() {
    const tagSet = new Set();
    this.entries.forEach(entry => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => tagSet.add(tag));
      }
    });
    this.availableTags = Array.from(tagSet);
  }

  render() {
    const isEditing = Boolean(this._currentEntry);
    const content = isEditing ? this._currentEntry.content : this.currentContent;
    const tags = isEditing ? this._currentEntry.tags : this.currentTags;
    const timestamp = isEditing ? this._currentEntry.timestamp : this.currentTimestamp;
    const charCount = content.length;
    const remainingChars = this.MAX_CHARS - charCount;
    const charCountClass = remainingChars < 100 ? 'at-limit' : 
                          remainingChars < 200 ? 'near-limit' : '';

    return html`
      <div class="container">
        <div class="sidebar">
          <button class="new-button" @click=${this._newEntry}>New Entry</button>
          <h3>Your Entries</h3>
          ${this.entries.map(entry => html`
            <div class="entry" @click=${() => this.editEntry(entry)}>
              <strong>${entry.title || 'Untitled'}</strong><br>
              <span>${new Date(entry.timestamp).toLocaleString()}</span>
              ${entry.tags.length ? html`<br><small>${entry.tags.join(', ')}</small>` : ''}
            </div>
          `)}
        </div>
        <div class="editor">
          <h3>${isEditing ? 'Edit Entry' : 'New Entry'}</h3>
          <label>Timestamp:</label>
          <input type="datetime-local" 
                 .value=${this._formatTimestamp(timestamp)} 
                 @change=${this._updateTimestamp}>
  
          <label>Content:</label>
          <textarea 
            maxlength=${this.MAX_CHARS}
            @input=${this._updateContent}
            .value=${content}
            placeholder="Write your thoughts here..."></textarea>
          <div class="char-count ${charCountClass}">
            ${remainingChars} characters remaining
          </div>
          
          <label>Tags:</label>
          <tags-input
            .tags=${tags}
            .suggestions=${this.availableTags}
            @tags-changed=${this._updateTags}
          ></tags-input>
          
          <button @click=${this._saveEntry}>Save</button>
          ${isEditing ? html`<button @click=${this._deleteEntry}>Delete</button>` : ''}
        </div>
      </div>
    `;
  }

  _formatTimestamp(ts) {
    const date = new Date(ts);
    return date.toISOString().slice(0, 16);
  }

  _updateTimestamp(e) {
    const timestamp = new Date(e.target.value).getTime();
    if (this._currentEntry) {
      this._currentEntry.timestamp = timestamp;
    } else {
      this.currentTimestamp = timestamp;
    }
  }

  _updateContent(e) {
    const newContent = e.target.value.slice(0, this.MAX_CHARS);
    if (this._currentEntry) {
      this._currentEntry.content = newContent;
    } else {
      this.currentContent = newContent;
    }
    this.requestUpdate();
  }

  _updateTags(e) {
    if (this._currentEntry) {
      this._currentEntry.tags = e.detail.tags;
    } else {
      this.currentTags = e.detail.tags;
    }
  }

  _newEntry() {
    this._currentEntry = null;
    this.currentContent = '';
    this.currentTags = [];
    this.currentTimestamp = Date.now();
    this.requestUpdate();
  }

  async _saveEntry() {
    const entry = this._currentEntry || { 
      content: this.currentContent, 
      timestamp: this.currentTimestamp, 
      tags: this.currentTags,
      title: this.currentContent.substring(0, 20) || 'Untitled'
    };

    if (this._currentEntry) {
      entry.title = entry.content.substring(0, 20) || 'Untitled';
    }

    try {
      const response = await fetch('/journal/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      const saved = await response.json();
      console.log('Saved entry:', saved);
      this._currentEntry = null;
      this.currentContent = '';
      this.currentTags = [];
      this.currentTimestamp = Date.now();
      await this.loadEntries();
    } catch (error) {
      console.error('Error saving entry', error);
    }
  }

  async _deleteEntry() {
    if (!this._currentEntry) return;
    try {
      await fetch(`/journal/entry/${this._currentEntry.id}`, { method: 'DELETE' });
      this._currentEntry = null;
      this.currentContent = '';
      this.currentTags = [];
      this.currentTimestamp = Date.now();
      await this.loadEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  }

  editEntry(entry) {
    this._currentEntry = Object.assign({}, entry);
    this.requestUpdate();
  }
}

customElements.define('journal-app', JournalApp);
