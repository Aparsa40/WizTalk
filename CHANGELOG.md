# Changelog

## 2.1.0 — Unreleased

### Added
- Server-authoritative SQLite persistence for authenticated users, sessions, profiles, preferences, custom Characters, per-user Character settings, chat sessions/messages, Character/user-scoped knowledge, and response telemetry.
- Transactional startup migrations recorded in schema_migrations.
- Database migration tests covering the complete schema and migration idempotency.
- Render deployment configuration with persistent /data storage and an explicit health check.

### Changed
- Chat history, custom Characters, Character settings, profile, and preferences are no longer browser-local sources of truth.
- Response telemetry is persisted with user/session/message ownership context and sanitized failure metadata.
- CI now runs the full test suite before the production build and exercises authenticated API startup flow.
- Production deployment uses npm ci and Node.js 22.5+.
- The application version is advanced from the v2.0.0 stable baseline to v2.1.0 for this persistence feature release.

### Fixed
- Corrected SQL migration filename discovery so startup migrations are actually discovered and applied.
- Applied the Dependabot ip-address 10.7.3 security update directly to the persistence release branch.

### Deployment notes
- Render currently uses a single web instance with a persistent SQLite disk. This topology is not horizontally scalable; migrate to a shared database before adding multiple application instances.
- SQLite data is durable only under the configured persistent mount (/data).

### Remaining
- Long-term memory retrieval/management and retention policies are not yet implemented.
- Provider health/cooldown remains process-local by design.
- Production moderation, tools/agents, richer Avatar/Voice work, and broader observability remain future phases.

Previous stable baseline: v2.0.0 — 2026-09-12.
