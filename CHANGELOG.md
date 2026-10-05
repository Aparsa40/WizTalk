Unreleased — Post-v2 Development

Added:
- Server-side SQLite persistence for users, sessions, chat sessions, chat messages, and Character-scoped knowledge.
- Transactional startup migrations with schema_migrations.
- Persisted response/provider telemetry with user, chat-session, message, Character, provider, model, latency, success, and sanitized error classification metadata.
- Production Render database path using the persistent /data disk.
- Database migration tests.

Changed:
- Chat history is now server-authoritative through authenticated session APIs.
- Database initialization now applies pending migrations before application services use the database.
- Response logging no longer depends on console output as its persistence mechanism.
- Documentation now distinguishes durable server persistence from remaining browser-local state.

Remaining persistence work:
- Custom Characters are still browser-local.
- Some user-facing Character/UI settings are still browser-local.
- Long-term memory tables and retention policies are not yet implemented.
- Provider health/cooldown state remains process-local by design.

Previous stable baseline: v2.0.0 — 2026-09-12.
