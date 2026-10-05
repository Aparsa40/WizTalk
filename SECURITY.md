# Security Policy

WizTalk now has authenticated server-side persistence for accounts, sessions, profiles, preferences, custom Characters, Character settings, chat history, knowledge, and response telemetry.

## Credentials

Provider credentials remain server-side environment variables. They must never be stored in browser localStorage or database records.

## Ownership

- Authentication sessions use hashed tokens.
- Chat sessions and messages are scoped to the authenticated user.
- Custom Characters are scoped to the authenticated user.
- Character settings are scoped to the authenticated user.
- Knowledge access is scoped to the authenticated user and Character.
- Built-in Character definitions remain trusted repository data.
- Provider/model routes are validated server-side.

## Response telemetry

Response telemetry stores identifiers, provider/model names, success state, latency, and sanitized error categories.

It must not store API keys, passwords, session tokens, raw provider payloads, or unnecessary raw user content.

## Database

SQLite uses WAL mode, foreign keys, and a persistent production path. Schema changes use numbered transactional migrations.

## Browser storage

Browser localStorage is not the source of truth for authenticated application data. The obsolete client-local conversation memory store has been removed.

## Known limitations

- The memories table is a foundation only; long-term memory behavior is not yet implemented.
- Provider health/cooldown state is process-local operational state and resets after restart.
- Production moderation and tool/agent permission architecture are future work.

Before production changes run npm run lint, npm test, and npm run build, and review dependencies, HTTPS, security headers, and deployment storage.

Last Updated: 2026-10-05
