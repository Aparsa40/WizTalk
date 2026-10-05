Unreleased — Post-v2 Development

Added:
- Server-side SQLite persistence for users, sessions, profiles, preferences, custom Characters, Character settings, chat sessions, chat messages, Character/user-scoped knowledge, and response telemetry.
- Transactional startup migrations with schema_migrations.
- A durable memories table as the foundation for future long-term memory.
- Production Render database path using the persistent /data disk.
- Database migration tests.

Changed:
- Chat history is server-authoritative through authenticated session APIs.
- Custom Characters and Character settings are server-side and user-owned.
- Profile and preferences are server-side and user-owned.
- Response logging is persisted in SQLite with sanitized error classifications.
- The obsolete client-local conversation memory store has been removed.
- Documentation now reflects the current runtime.

Remaining:
- Long-term memory retrieval/management and retention policies are not yet implemented.
- Provider health/cooldown remains process-local by design.
- Production moderation, tools/agents, and richer Avatar/Voice work remain future phases.

Previous stable baseline: v2.0.0 — 2026-09-12.
