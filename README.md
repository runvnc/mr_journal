# mr_journal Plugin

A generic journaling plugin that provides a facility for users to create, edit, and manage journal entries. Journal entries include a timestamp (editable) and tags. Entries are saved as JSON files under `data/[user]/journal/[yyyy-mm]/`.

## Features

- Create, edit, and delete journal entries
- Editable timestamp and tag support
- Consistent integration with the main agent UI using existing CSS and assets

## Installation

```bash
pip install -e .
```

## Structure

```
mr_journal/
├── plugin_info.json
├── README.md
├── setup.py
├── pyproject.toml
└── src/
    └── mr_journal/
        ├── mod.py
        ├── router.py
        ├── inject/
        │   └── journal.jinja2
        ├── static/
        │   └── js/
        │       └── journal.js
        └── __init__.py
```
