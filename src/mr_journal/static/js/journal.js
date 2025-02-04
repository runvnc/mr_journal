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
    :host { display: block; background-color: #001f3f; color: #fff; padding: 15px; font-family: sans-serif; }
    .container { display: flex; }
    .sidebar { width: 30%; border-right: 1px solid #fff; padding-right: 10px; }
    .editor { width: 70%; padding-left: 10px; }
    .entry { margin-bottom: 10px; padding: 5px; border: 1px solid #fff; border-radius: 3px; cursor: pointer; }
    .entry:hover { background-color: rgba(255,255,255,0.1); }
    input, textarea {
      width: 100%;
      margin: 5px 0;
      padding: 8px;
      border: none;
      border-radius: 3px;
    }
    button {
      padding: 8px 12px;
      border: none;
      border-radius: 3px;
      background-color: #fff;
      color: #001f3f;
      cursor: pointer;
      margin-right: 8px;
    }
    .new-button {
      background-color: #4CAF50;
      color: white;
      font-weight: bold;
      margin-bottom: 15px;
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
    this.MAX_CHARS = 2000; // About 1 page of text
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
          <textarea rows="10" 
                    maxlength=${this.MAX_CHARS}
                    @input=${this._updateContent}
                    .value=${content}></textarea>
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
