# Character System

Phase 2 makes `Character` the self-contained data contract. Each character JSON document contains:

- `identity`: identifiers, presentation details, personality, greeting, and character instructions.
- `avatar`: renderer-independent Avatar data and independently selectable Avatar assets.
- `backgrounds`: independently selectable Character background assets; Background selection is not coupled to Avatar selection.
- `knowledge`: `faq`, `raw`, and named `sources` extension points.
- `textModels`: provider/model preferences only; provider credentials remain environment variables on the server.
- `voiceModels`: response-model and output preferences; final playback remains in the voice runtime.
- `settings`: current enabled/source metadata and a home for future character settings.

## Avatar and Background independence

A Character may expose multiple Avatar assets and multiple Background assets. The two selections are persisted independently:

```json
{
  "avatar": {
    "selectedId": "harry-classic",
    "assets": [
      {"id": "harry-classic", "type": "animated-2d", "source": "/avatars/harry-classic.svg"}
    ]
  },
  "backgrounds": {
    "selectedId": "hogwarts-hall",
    "assets": [
      {"id": "hogwarts-hall", "source": "/avatars/harry-hall.svg"}
    ]
  }
}
```

This allows combinations such as one Avatar with a different Background without requiring coupled preset pairs. The model is renderer-neutral and is ready for future SVG, Live2D, VRM/3D, or other Avatar renderers.

Legacy Character data with coupled avatar/background presets remains compatible through the existing normalization path.

## Runtime boundaries

The server normalizes legacy flat character records before returning them, and the browser applies the same normalizer to persisted custom characters. This preserves custom characters saved by previous schemas while ensuring every runtime consumer receives the current structure. Local FAQ lookup uses a character's inline FAQ entries when supplied and otherwise preserves the shared FAQ file behavior.

Built-in JSON files in `data/characters` are loaded by the server. The browser `CharacterService` combines them with custom characters stored in localStorage. Runtime rendering, speech, and model calls are deliberately outside this data contract.
