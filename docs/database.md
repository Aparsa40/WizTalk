# Database & Persistence

## Current architecture

Browser
→ HTTPS/API
→ Express Server
→ domain services
→ SQLite persistence

SQLite uses WAL mode, foreign keys, and a configurable WIZTALK_DB_PATH.

## Durable tables

- users — account identity.
- sessions — hashed authentication session tokens and expiry.
- user_profiles — user profile data.
- user_preferences — selected Character and voice preference.
- chat_sessions — user-owned conversations and Character association.
- chat_messages — durable conversation messages.
- custom_characters — user-owned custom Character JSON.
- character_settings — user-owned Character presentation/settings overrides.
- knowledge_documents — Character/user-scoped knowledge.
- memories — reserved durable structure for the future long-term memory layer.
- response_logs — provider/model attempt telemetry.
- schema_migrations — applied migration history.

## Migration model

Schema changes are numbered SQL migrations under server/database/migrations.

The migration runner:

1. creates schema_migrations if needed;
2. discovers numbered SQL files;
3. applies unapplied migrations in lexical order;
4. records successful migrations;
5. runs each migration inside a transaction.

The server runs migrations during database initialization before application services use the database.

Current migrations:

1. 000_initial_schema.sql
2. 001_add_response_logs.sql
3. 002_extend_response_logs.sql
4. 003_user_data.sql

A separate server/database/migrate.ts command exists for explicit migration execution.

## Ownership

- Built-in Characters are repository-owned.
- Custom Characters are owned by the authenticated user.
- Character settings are owned by the authenticated user.
- Chat sessions/messages are owned by the authenticated user.
- Knowledge records are scoped by authenticated user and Character.
- Response telemetry is server-side.
- Provider credentials are environment variables, never database records.
- Provider health/cooldown is process-local operational state and may reset after restart.

## Memory boundary

Conversation history is durable application data. The memories table exists for the future long-term memory feature; it is not yet populated or retrieved by the response pipeline.

## Production

Render uses WIZTALK_DB_PATH=/data/wiztalk.sqlite on a persistent disk. SQLite is the current production engine. Database access stays behind server services so a future PostgreSQL migration does not require moving persistence into the browser.
