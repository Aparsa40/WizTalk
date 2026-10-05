# Data Layer

WizTalk uses a server-authoritative persistence layer. The browser is a presentation client; it is not the source of truth for conversations or account-owned data.

## Storage boundaries

### Repository-owned static data

- `data/characters/*.json` — built-in Character definitions.
- FAQ and inline Character knowledge shipped with the application.

Built-in Character configuration remains server-owned and is not copied into per-user database records.

### SQLite application data

The database path is controlled by `WIZTALK_DB_PATH` and defaults to `data/wiztalk.sqlite`.

The schema is managed by ordered SQL migrations under `server/database/migrations/`. `server/services/database.ts` opens SQLite, enables WAL/foreign keys, and runs migrations before the application uses the database.

Current persisted domains:

- `users` — account identity and password hash/salt.
- `sessions` — hashed authentication sessions.
- `chat_sessions` — user-owned conversations and Character ownership.
- `chat_messages` — durable conversation messages.
- `knowledge_documents` — persisted Character knowledge documents.
- `response_logs` — provider/model outcome and latency telemetry.
- `user_profiles` — durable user profile memory.
- `user_preferences` — durable application preferences.
- `custom_characters` — account-owned custom Character definitions.
- `character_settings` — account-owned Character overrides.
- `memories` — schema for durable Character-scoped long-term memory.

## Ownership rule

Every user-owned record must be scoped by `user_id` and every API lookup must verify the authenticated owner before returning or mutating it.

Chat history is never loaded from browser localStorage. The server resolves the authenticated user, then the session, then the session's Character before generating a response.

## Migration rule

Never add production tables directly inside `database.ts`. Add an ordered migration file instead. Migrations are transactional and recorded in `schema_migrations`.

The normal server startup runs pending migrations automatically.

## Large assets

SQLite stores metadata and text application state. Large binary assets such as Avatar/video/audio files should remain in the filesystem or object storage and be referenced by durable database metadata rather than stored as SQLite BLOBs.
