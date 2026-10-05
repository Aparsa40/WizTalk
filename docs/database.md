# Database & Persistence

## Current architecture

WizTalk uses a server-authoritative SQLite persistence layer for authenticated application data.

```
Browser
  ↓ HTTPS/API
Express Server
  ├─ Authentication
  ├─ Character resolution
  ├─ Chat sessions/messages
  ├─ Knowledge documents
  └─ Response telemetry
        ↓
   Persistence Layer
        ↓
   SQLite (WAL)
        ↓
   WIZTALK_DB_PATH
```

The database file is selected by `WIZTALK_DB_PATH`. Development defaults to `data/wiztalk.sqlite`; the Render deployment configuration uses `/data/wiztalk.sqlite` on a persistent disk.

## Durable tables

- `users` — account identity and password hashes/salts.
- `sessions` — hashed authentication session tokens and expiry.
- `chat_sessions` — user-owned conversations and Character association.
- `chat_messages` — durable user/Character messages.
- `knowledge_documents` — Character-scoped knowledge documents.
- `response_logs` — provider/model attempt telemetry, latency, success/failure classification, and request ownership metadata.
- `schema_migrations` — applied SQL migration history.

Foreign keys and indexes are enabled by the database bootstrap.

## Migration model

Schema creation is migration-driven. `server/database/migration-runner.ts`:

1. creates `schema_migrations` if necessary;
2. discovers numbered SQL files under `server/database/migrations`;
3. applies unapplied migrations in lexical order;
4. records each successful migration;
5. runs each migration inside a transaction.

The server runs migrations during database initialization before the rest of the server uses the database.

Current migrations:

1. `000_initial_schema.sql`
2. `001_add_response_logs.sql`
3. `002_extend_response_logs.sql`

## Ownership boundaries

- Built-in Characters remain repository-owned JSON/domain configuration.
- Chat sessions and messages are always scoped to the authenticated user.
- Knowledge documents are Character-scoped server data.
- Response telemetry is server-side and does not store API keys, passwords, or raw provider error payloads.
- Provider credentials remain environment variables and are never database records.
- Provider health/cooldown state is intentionally process-local operational state; it is safe to reconstruct after a restart.

## Browser persistence

The server is authoritative for chat history, authentication, knowledge, and response telemetry.

Browser `localStorage` is still used for client-only state that has not yet been migrated to server ownership, including custom Character storage and some UI/user preference state. It must never contain provider credentials or other secrets.

## Production direction

SQLite is the current production persistence engine because the deployment provides a persistent Render disk. Database access remains behind server services so a future PostgreSQL migration can replace the storage engine without moving persistence back into the browser.

The next persistence task is migrating custom Characters and user-owned Character settings to authenticated server storage while preserving server-authoritative provider/model strategy.
