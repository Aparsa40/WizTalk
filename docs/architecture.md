# Architecture

WizTalk uses a React/Vite client and an Express server. The client owns presentation and client-only UI state; the server owns authentication, built-in Character resolution, provider credentials, chat persistence, knowledge persistence, and response orchestration.

## Main runtime

```
Browser
  ↓
React / ChatUI
  ↓
ApiService
  ↓
Express Server
  ├─ Authentication
  ├─ Character Resolution
  ├─ Chat Session / Message Service
  ├─ Knowledge Service
  ├─ ResponseManager
  │    ├─ configured provider
  │    ├─ fallback provider
  │    ├─ local provider
  │    └─ controlled final fallback
  └─ TTS
        ↓
   SQLite Persistence
```

Chat history, accounts, knowledge documents, and response telemetry are server-side durable data. Browser localStorage is not the source of truth for conversations.

## Database boundary

Database access is centralized through server services and a migration runner. Migrations are executed during database initialization and recorded in `schema_migrations`.

The current production deployment uses SQLite on a persistent Render disk. The database path is controlled by `WIZTALK_DB_PATH`.

## Character boundary

Built-in Character definitions remain repository-owned data. The server normalizes them before use. Character/provider/model strategy remains server-authoritative.

Custom Characters, user profiles, preferences, Character settings, chat history, knowledge ownership, and response telemetry are server-authoritative and scoped to the authenticated user where applicable. Browser localStorage is not the source of truth for these domains.

## Operational state

Provider health/cooldown information is intentionally process-local operational state. It is not persisted because it can safely be reconstructed after a process restart.

See [Database & Persistence](database.md) for the persistence model.
