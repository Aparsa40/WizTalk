# WizTalk

WizTalk is a Persian-first, modular interactive AI character platform. Each Character is an independent hybrid chatbot with its own identity, personality, Avatar, Background, voice configuration, AI route, knowledge, settings, and memory boundary.

Current stable baseline: v2.0.0. Post-v2 work is unreleased until an explicit version is cut.

## Persistence

WizTalk now uses server-authoritative SQLite persistence for authenticated application data.

Persisted server data currently includes:

- user accounts and authentication sessions;
- chat sessions and messages;
- Character-scoped knowledge documents;
- response/provider telemetry;
- schema migration history.

The production Render configuration stores SQLite at /data/wiztalk.sqlite on a persistent disk. Pending migrations are applied automatically during database initialization.

Chat history is no longer browser-local. Browser localStorage remains only for client-local state that has not yet moved to server ownership, notably custom Characters and some user-facing preferences.

See docs/database.md for the database architecture and migration rules.

## Character isolation

Built-in Characters are Harry, Hermione, and Ron. Their definitions remain repository-owned domain configuration. Provider/model strategy remains server-authoritative.

Custom Characters are currently browser-local. They are not yet cross-device durable and are not yet part of the authenticated database ownership model.

## Response Manager

ResponseManager owns response orchestration and fallback. Response attempts are now persisted as sanitized telemetry without API keys, passwords, raw provider payloads, or raw provider error details.

## Voice

The current Voice Chat path is text response generation followed by TTS, not end-to-end speech-to-speech. Provider credentials remain server-side.

## Development

Requirements: Node.js 20+

    npm install
    npm run dev
    npm run lint
    npm test
    npm run build

The normal server startup runs pending database migrations automatically. The db:migrate script is also available for explicit migration execution.

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

## Roadmap

1. Expand real AI model activation to all built-in Characters.
2. Complete production persistence.
3. Migrate custom Characters and user-owned Character settings to server persistence.
4. Long-term memory.
5. Production Avatar, Live2D and 3D renderers.
6. Advanced Voice and Lip-Sync.
7. Moderation and Safety.
8. Agent and Tools architecture.
9. Production observability and deployment hardening.
10. UX and product polish.
