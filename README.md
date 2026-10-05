# WizTalk

WizTalk is a Persian-first modular interactive AI character platform. Each Character is an independent hybrid chatbot with its own identity, personality, Avatar, Background, voice configuration, AI route, knowledge, settings, and memory boundary.

Current application version: v2.1.0. This persistence release is the next version after the v2.0.0 stable baseline.

## Persistence

WizTalk uses server-authoritative SQLite persistence for authenticated application data.

Durable data currently includes:

- user accounts and authentication sessions;
- user profile and preferences;
- built-in Character configuration from repository data;
- custom Characters owned by the authenticated user;
- per-user Character settings;
- chat sessions and messages;
- Character/user-scoped knowledge documents;
- response/provider telemetry;
- schema migration history.

Production Render stores SQLite at /data/wiztalk.sqlite on a persistent disk. Pending migrations run transactionally during database initialization and are recorded in schema_migrations.

Browser localStorage is no longer the source of truth for accounts, chat history, custom Characters, Character settings, profile, or preferences. Provider credentials are never stored in the browser.

See docs/database.md for the persistence architecture.

## Character isolation

Built-in Characters are Harry, Hermione, and Ron and remain repository-owned domain configuration.

Custom Characters are stored server-side with an authenticated user owner. A user cannot read, update, or delete another user's custom Character through the API.

Provider/model selection remains server-authoritative. Runtime route resolution validates the configured provider/model against the supported server configuration.

## Response Manager

ResponseManager owns response orchestration and fallback. Response attempts are persisted as sanitized telemetry with user/session/message context. API keys, passwords, raw provider payloads, and raw provider error details are not stored.

## Voice

The current Voice Chat path is text response generation followed by TTS, not end-to-end speech-to-speech. Provider credentials remain server-side.

## Development

Requirements: Node.js 22.5+

    npm ci
    npm run dev
    npm run lint
    npm test
    npm run build

Database migrations run automatically on server startup. The db:migrate script can also run the migration runner explicitly.

## Production deployment

The supported first production topology is a single Render web service with a 2 GB persistent disk mounted at /data. SQLite is intentionally single-instance: do not horizontally scale this service while it uses the local SQLite database. If horizontal scaling becomes a requirement, migrate persistence to a shared database such as PostgreSQL.

Before deployment, run npm ci, npm run lint, npm test, and npm run build. Render uses npm ci && npm run build, starts with npm start, and checks /api/health for service health.

## Documentation

- docs/architecture.md
- docs/database.md
- docs/data-layer.md
- docs/character-system.md
- docs/voice-system.md
- docs/memory-system.md
- docs/roadmap.md
- docs/deployment.md
- docs/development.md
- SECURITY.md
- CHANGELOG.md

## Remaining roadmap

1. Long-term memory behavior and retention/deletion policies.
2. Production Avatar / Live2D / 3D renderers.
3. Advanced Voice and Lip-Sync.
4. Moderation and Safety.
5. Agent and Tools architecture.
6. Production observability and deployment hardening.
7. UX and product polish.
