import { LitElement, html, css } from '/chat/static/js/lit-core.min.js';
import {BaseEl} from '/chat/static/js/base.js'

class TagsInput extends BaseEl {
  static properties = {
    tags: { type: Array },
    suggestions: { type: Array },
    value: { type: String },
    placeholder: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      font-family: sans-serif;
    }
    .tags-input-container {
      border: 1px solid #333;
      padding: 5px;
      border-radius: 4px;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      background: #101020;
      min-height: 38px;
    }
    .tag {
      background-color: #1a1a1a;
      padding: 5px 10px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      gap: 5px;
      color: #f0f0f0;
    }
    .tag-close {
      cursor: pointer;
      color: #888;
    }
    .tags-input {
      border: none;
      outline: none;
      flex: 1;
      min-width: 120px;
      padding: 5px;
      background: transparent;
      color: #f0f0f0 !important;
      -webkit-text-fill-color: #f0f0f0;
    }
    .tags-input::placeholder {
      color: #666;
      -webkit-text-fill-color: #666;
    }
    .suggestions {
      position: absolute;
      border: 1px solid #333;
      background: #101020;
      max-height: 150px;
      overflow-y: auto;
      width: 200px;
      display: none;
      z-index: 1000;
      color: #f0f0f0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .suggestion-item {
      padding: 5px 10px;
      cursor: pointer;
    }
    .suggestion-item.selected {
      background-color: #1a1a1a;
    }
    .suggestion-item:hover {
      background-color: #1a1a1a;
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
    this.tags = [];
    this.suggestions = [];
    this.value = '';
    this.placeholder = 'Type to add tags...';
    this.selectedIndex = -1;
  }

  render() {
    return html`
      <div class="tags-input-container" @click=${this._focusInput}>
        ${this.tags.map(tag => html`
          <span class="tag">
            ${tag}
            <span class="tag-close" @click=${() => this._removeTag(tag)}>×</span>
          </span>
        `)}
        <input
          type="text"
          class="tags-input"
          .value=${this.value}
          .placeholder=${this.placeholder}
          @input=${this._onInput}
          @keydown=${this._onKeyDown}
        >
      </div>
      <div class="suggestions"></div>
    `;
  }

  _focusInput(e) {
    this.renderRoot.querySelector('.tags-input').focus();
  }

  _onInput(e) {
    this.value = e.target.value;
    this._showSuggestions(this.value);
  }

  _showSuggestions(filter) {
    const suggestionsBox = this.renderRoot.querySelector('.suggestions');
    const matches = this.suggestions.filter(s => 
      s.toLowerCase().includes(filter.toLowerCase()) &&
      !this.tags.includes(s)
    );
    
    if (matches.length && filter) {
      suggestionsBox.style.display = 'block';
      suggestionsBox.innerHTML = matches
        .map((s, index) => `<div class="suggestion-item${index === 0 ? ' selected' : ''}">${s}</div>`)
        .join('');
      
      const rect = this.renderRoot.querySelector('.tags-input-container').getBoundingClientRect();
      suggestionsBox.style.top = `${rect.bottom}px`;
      suggestionsBox.style.left = `${rect.left}px`;
      
      this.selectedIndex = 0;
      this._addSuggestionListeners();
    } else {
      suggestionsBox.style.display = 'none';
      this.selectedIndex = -1;
    }
  }

  _addSuggestionListeners() {
    const suggestions = this.renderRoot.querySelectorAll('.suggestion-item');
    suggestions.forEach(item => {
      item.addEventListener('click', () => {
        this._addTag(item.textContent);
      });
    });
  }

  _onKeyDown(e) {
    const suggestions = this.renderRoot.querySelectorAll('.suggestion-item');
    
    if ((e.key === 'Tab' || e.key === ' ') && this.selectedIndex >= 0) {
      e.preventDefault();
      if (suggestions[this.selectedIndex]) {
        this.value = suggestions[this.selectedIndex].textContent;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.selectedIndex >= 0 && suggestions[this.selectedIndex]) {
        this._addTag(suggestions[this.selectedIndex].textContent);
      } else if (this.value) {
        this._addTag(this.value);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.selectedIndex < suggestions.length - 1) {
        this.selectedIndex++;
        this._updateSelection();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
        this._updateSelection();
      }
    }
  }

  _updateSelection() {
    const suggestions = this.renderRoot.querySelectorAll('.suggestion-item');
    suggestions.forEach((s, i) => {
      s.classList.toggle('selected', i === this.selectedIndex);
    });
  }

  _addTag(text) {
    if (text && !this.tags.includes(text)) {
      this.tags = [...this.tags, text];
      this.value = '';
      this.renderRoot.querySelector('.suggestions').style.display = 'none';
      this._dispatchChange();
    }
  }

  _removeTag(tagToRemove) {
    this.tags = this.tags.filter(tag => tag !== tagToRemove);
    this._dispatchChange();
  }

  _dispatchChange() {
    this.dispatchEvent(new CustomEvent('tags-changed', {
      detail: { tags: this.tags },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('tags-input', TagsInput);
