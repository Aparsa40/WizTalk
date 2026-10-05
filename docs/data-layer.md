# Data Layer

WizTalk uses a server-side persistence boundary for authenticated data.

Static built-in Character definitions remain repository data under data/characters.

Server-owned durable data includes users, sessions, profiles, preferences, custom Characters, Character settings, chat sessions, messages, knowledge, and response telemetry.

ApiService is the browser boundary for server persistence. The browser must not become the source of truth for authenticated application data.

The runtime flow is:

UI
↓
ApiService
↓
Express routes
↓
Domain services
↓
SQLite

Custom Characters and user-facing Character settings are now server-side and user-owned. Built-in Character definitions remain repository-owned.

See docs/database.md for the schema and migration model.
