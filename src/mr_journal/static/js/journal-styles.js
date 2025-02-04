import { css } from '/chat/static/js/lit-core.min.js';

export const journalStyles = css`
  :host { 
    display: block; 
    background-color: #101020; 
    color: #f0f0f0; 
    padding: 15px; 
    font-family: ui-sans-serif, -apple-system, system-ui, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif;
  }
  .container { 
    display: flex; 
    gap: 20px;
    flex-direction: row;
    height: calc(100vh - 180px);
  }
  .logo {
    width: 120px;
    height: auto;
    margin-bottom: 15px;
  }
  .sidebar {
    display: flex;
    flex-direction: column;
    width: 30%;
    border-right: 1px solid #333;
    padding-right: 10px;
  }
  .entries-list {
    overflow-y: auto;
    flex: 1;
  }
  .editor { 
    width: 70%; 
    padding-left: 10px;
    overflow-y: auto;
  }
  .entry { 
    margin-bottom: 10px; 
    padding: 8px; 
    border: 1px solid #333; 
    border-radius: 8px; 
    cursor: pointer;
    background-color: #101020;
    transition: all 0.2s ease;
  }
  .entry:hover { 
    background-color: #1a1a1a;
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
    box-sizing: border-box;
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
    position: sticky;
    top: 0;
    z-index: 1;
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
    --tags-bg-color: #101020;
    --tags-border-color: #333;
    --tag-bg-color: #1a1a1a;
    --tag-text-color: #f0f0f0;
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

  /* Responsive Design */
  @media (max-width: 768px) {
    .container {
      flex-direction: column;
      height: calc(100vh - 140px);
    }
    .sidebar, .editor {
      width: 100%;
      padding: 0;
      border-right: none;
    }
    .sidebar {
      border-bottom: 1px solid #333;
      padding-bottom: 20px;
      margin-bottom: 20px;
      max-height: 40vh;
    }
    .entries-list {
      max-height: calc(40vh - 60px);
    }
    .editor {
      height: 50vh;
      overflow-y: auto;
    }
    .logo {
      width: 80px;
    }
  }

  @media (max-width: 480px) {
    :host {
      padding: 10px;
    }
    button {
      width: 100%;
      margin-bottom: 10px;
    }
    .entry {
      padding: 6px;
    }
  }
`;
