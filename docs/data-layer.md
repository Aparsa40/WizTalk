# Data Layer

WizTalk now has a server-side persistence layer for authenticated application data. Static built-in Character definitions remain repository data under `data/characters`; user/session/chat state is persisted through the server database.

## Server-owned durable data

- Authentication users and sessions.
- Chat sessions and messages.
- Character-scoped knowledge documents.
- Response/provider telemetry.
- Database migration history.

The database bootstrap lives in `server/services/database.ts`. Schema changes are applied through the numbered SQL migrations under `server/database/migrations`.

## Client boundary

`CharacterService` remains the browser boundary for Character presentation. Built-in Characters are loaded from the server. Custom Characters and some user-facing settings are still browser-local and are therefore **not yet cross-device durable**.

`ApiService` is the boundary for authenticated server persistence. Chat history must use the session APIs rather than browser message storage.

## Persistence contract

```
UI
 ↓
API Service
 ↓
Express / domain services
 ↓
Persistence services
 ↓
Database
```

The browser must not become the source of truth for authenticated conversations, accounts, knowledge, or provider telemetry.

See [Database & Persistence](database.md) for the current schema and migration model.
