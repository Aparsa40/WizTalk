Security Policy

WizTalk now has authenticated server-side persistence for accounts, sessions, chat history, Character-scoped knowledge, and response telemetry.

API keys remain server-side environment variables and must never be stored in browser localStorage or database records.

Authentication sessions use hashed tokens. Chat sessions are scoped by authenticated user. Knowledge is Character-scoped. Future user-owned resources must enforce the same ownership boundary.

Response telemetry stores operational metadata and sanitized error categories. It must not store API keys, passwords, session tokens, raw provider payloads, or unnecessary raw user content.

SQLite uses WAL mode and foreign keys. Production SQLite must live on persistent storage. Schema changes use numbered transactional migrations.

Browser localStorage is not the source of truth for authenticated chat history. Custom Characters and some user-facing settings remain browser-local until their authenticated persistence phase is implemented.

Known limitations:
- Custom Characters are not yet cross-device durable.
- Some Character/UI settings remain client-local.
- Long-term memory, production moderation, and tool/agent permissions are future work.
- Provider health/cooldown is process-local operational state and resets after restart.

Before production changes run npm run lint, npm test, and npm run build, and review dependencies and deployment HTTPS/security headers.

Last Updated: 2026-10-05
