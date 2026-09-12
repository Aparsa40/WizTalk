# Character System

Phase 2 makes `Character` the self-contained data contract. Each character JSON document contains:

- `identity`: identifiers, presentation details, personality, greeting, and character instructions.
- `avatar`: renderer-independent data consumed unchanged by the completed Avatar architecture.
- `knowledge`: `faq`, `raw`, and named `sources` extension points.
- `textModels.default`: provider/model preference only; provider credentials remain environment variables on the server.
- `voiceModels.default`: voice preference only; playback remains in the existing voice runtime.
- `settings`: current enabled/source metadata and a home for future character settings.

The server normalizes legacy flat character records before returning them, and the browser applies the same normalizer to persisted custom characters. This preserves custom characters saved by the previous schema while ensuring every runtime consumer receives the new structure. Local FAQ lookup uses a character's inline FAQ entries when supplied and otherwise preserves the shared FAQ file behavior.

Built-in JSON files in `data/characters` are loaded by the server. The browser `CharacterService` combines them with custom characters stored in localStorage. Runtime rendering, speech, and model calls are deliberately outside this data contract.
