import { LitElement, html, css } from '/chat/static/js/lit-core.min.js';
import {BaseEl} from '/chat/static/js/base.js'

class JournalApp extends LitElement {
  static properties = {
    username: { type: String },
    entries: { type: Array },
    availableTags: { type: Array }
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
    }
    datalist option {
      color: #001f3f;
    }
  `;

  constructor() {
    super();
    this.username = window.currentUser || 'guest';
    this.entries = [];
    this.availableTags = [];
    this._currentEntry = null;
  }

  connectedCallback() {
    super.connectedCallback();
    // The username is now determined from the server session,
    // so we don't rely on the attribute for data retrieval
    this.loadEntries();
  }

  async loadEntries() {
    try {
      const response = await fetch(`/journal/entries`);
      this.entries = await response.json();
      console.log({entries: this.entries})
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
    return html`
      <div class="container">
        <div class="sidebar">
          <h3>Your Entries</h3>
          ${this.entries.map(entry => html`
            <div class="entry" @click=${() => this.editEntry(entry)}>
              <strong>${entry.title || 'Untitled'}</strong><br>
              <span>${new Date(entry.timestamp).toLocaleString()}</span>
            </div>
          `)}
        </div>
        <div class="editor">
          <h3>${this._currentEntry ? 'Edit Entry' : 'New Entry'}</h3>
          <label>Timestamp:</label>
          <input type="datetime-local" .value=${this._formatTimestamp(this._currentEntry ? this._currentEntry.timestamp : Date.now())} @change=${this._updateTimestamp}>
  
          <label>Content:</label>
          <textarea rows="10" @input=${this._updateContent}>${this._currentEntry ? this._currentEntry.content : ''}</textarea>
          
          <label>Tags (comma separated):</label>
          <input type="text" list="tag-options" .value=${this._currentEntry ? this._currentEntry.tags.join(', ') : ''} @input=${this._updateTags}>
          <datalist id="tag-options">
            ${this.availableTags.map(tag => html`<option value="${tag}"></option>`)}
          </datalist>
          
          <button @click=${this._saveEntry}>Save</button>
          ${this._currentEntry ? html`<button @click=${this._deleteEntry}>Delete</button>` : ''}
        </div>
      </div>
    `;
  }

  _formatTimestamp(ts) {
    const date = new Date(ts);
    return date.toISOString().slice(0, 16);
  }

  _updateTimestamp(e) {
    if (this._currentEntry) {
      this._currentEntry.timestamp = new Date(e.target.value).getTime();
    }
  }

  _updateContent(e) {
    if (this._currentEntry) {
      this._currentEntry.content = e.target.value;
    }
  }

  _updateTags(e) {
    if (this._currentEntry) {
      // Split tags on comma or whitespace, trim, and filter out empty strings
      this._currentEntry.tags = e.target.value.split(/,|\s+/).map(tag => tag.trim()).filter(tag => tag !== "");
    }
  }

  async _saveEntry() {
    const entry = this._currentEntry || { content: '', timestamp: Date.now(), tags: [], title: '' };
    entry.title = entry.content.substring(0, 20);
    try {
      const response = await fetch('/journal/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      const saved = await response.json();
      console.log('Saved entry:', saved);
      this._currentEntry = null;
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
      await this.loadEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  }

  editEntry(entry) {
    // Clone the entry so editing doesn't immediately affect the list
    this._currentEntry = Object.assign({}, entry);
    this.requestUpdate();
  }
}

customElements.define('journal-app', JournalApp);
