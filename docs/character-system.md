# Character System

Character is a first-class configuration object with identity, personality, greeting, system instructions, avatar configuration, AI provider/model defaults, voice configuration, and enabled state.

Built-in JSON files in data/characters are loaded by the server. Legacy flat personality and avatar values are normalized for compatibility. The browser CharacterService combines built-in data with custom characters stored in localStorage.

The CharacterManager and CharacterForm support create, edit, duplicate, and delete for custom characters. Built-ins are intentionally read-only in V1. Custom character system instructions are submitted only for that character's chat request; they are not written to the repository.

Implemented: data schema, service boundary, management UI, and custom chat handoff.
Future: database-backed character catalog, permissions, and media upload management.
