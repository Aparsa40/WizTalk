# Server-authoritative character runtime

## Boundary

`GET /api/characters` returns only character presentation data needed by the
browser: identity, description, personality display data, greeting, avatar,
and browser voice settings.  It intentionally omits `systemInstructions` and
the AI provider/model configuration.

The server loads a `ServerCharacter` from `data/characters` for every chat
request.  That runtime object contains system instructions and the internal AI
configuration.  API keys, request timeout, routing, provider choice, model
choice, and fallback behavior remain server environment/runtime concerns.

## Chat contract

The supported request body is:

```json
{
  "message": "string",
  "characterId": "string",
  "history": [{ "sender": "user", "text": "..." }]
}
```

`POST /api/chat` ignores no client character configuration because it accepts
none. It resolves `characterId` through the server character service and
rejects unknown IDs. `/api/models` returns `410 Gone` because the browser no
longer selects provider or model settings.

## Custom characters

CharacterManager continues to manage custom characters in browser localStorage
as presentation-only records. They can be rendered, edited, duplicated, and
removed, but cannot be used for chat until a later server-side authenticated
persistence and runtime-provisioning design exists. This avoids treating a
browser-controlled system prompt or AI configuration as trusted input.
