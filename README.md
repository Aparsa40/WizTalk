# WizTalk

WizTalk is a Persian-first, modular interactive AI character platform. Each Character is designed as an independent hybrid chatbot with its own identity, personality, Avatar, Background, voice configuration, AI route, knowledge, settings, and memory boundary.

**Current Version:** v2.0.0 — Architecture Baseline + Unreleased Post-v2 Voice/Avatar Stack
**Release Date:** 2026-09-12
**Status:** v2.0.0 remains the stable release baseline; post-v2 work currently enables Harry's live model-backed voice stack and independent Avatar/Background selection.

## v2.0.0 — What this release represents

WizTalk v2.0.0 is the first complete post-foundation baseline. It consolidates the eight initial architecture phases into one reviewed and independently testable platform foundation:

1. Avatar Architecture
2. Character Data Architecture
3. Response Manager
4. Voice Manager
5. Character-centric Chat UI
6. Character Settings
7. Responsive Pass
8. Integration & Acceptance

Post-v2 work is intentionally kept unreleased until the project owner decides on the next version/tag.

## Core Architecture

```text
User
  ↓
ChatUI
  ↓
API Service
  ↓
Express Server
  ↓
Character Resolution
  ↓
ResponseManager
  ↓
Configured Provider
  ↓
Fallback Providers
  ↓
Local Knowledge / Controlled Final Fallback
  ↓
Text Response

Voice path:
Microphone → Browser Speech Recognition → /api/chat (voice)
                                  ↓
                         ResponseManager
                         ├─ OpenRouter model #1
                         └─ Hugging Face model #2
                                  ↓
                            Text Response
                                  ↓
                            VoiceManager
                                  ↓
                         /api/tts → OpenRouter TTS #3
                                  ↓
                         MP3 → Avatar/Lip-Sync
                                  ↓
                         Browser TTS fallback
```

The current Voice Chat path is **text response generation + TTS**, not end-to-end speech-to-speech.

### Character isolation

Every Character has independent configuration for:
- Identity and personality
- Avatar assets and selected Avatar
- Background assets and selected Background
- Text model/provider route
- Voice response model/provider route
- TTS/output settings
- Knowledge
- User-facing settings
- Conversation/memory context

Legacy character data is normalized into the current schema without making provider internals user-editable.

### Response Manager

`ResponseManager` is the central response orchestration layer. It tries the Character's configured route first, then the remaining supported providers, local knowledge, and finally a controlled Persian fallback. Provider failures and raw provider errors remain server-side.

For Harry, both text and voice modes use the same explicit response pair:

1. **OpenRouter:** `minimax/minimax-m2.7:free`
2. **Hugging Face:** `Qwen/Qwen3.8-27B:fastest`

Voice mode therefore changes the input/output experience without silently switching the Character to a different conversational identity.

### Voice Manager

`VoiceManager` owns the final speech rendering layer. Harry's current TTS engine is OpenRouter's free `fish-audio/s2.1-pro-free:free` model through the server-side `/api/tts` endpoint. The browser receives audio bytes rather than the OpenRouter credential. Browser Speech Synthesis remains the final fallback.

### Avatar and Background architecture

Avatar and Background are separate Character resources. A Character can select any supported Avatar asset independently from any supported Background asset. Legacy coupled preset data remains compatible through normalization.

The Avatar system is renderer-neutral and supports states such as idle, listening, thinking, speaking, and error. The architecture is designed for future SVG, Live2D, VRM/3D, and video renderers.

## Current AI Providers and Models

The repository currently contains adapters for:

- **Local:** `faq-keyword-v1`
- **OpenRouter text:** `minimax/minimax-m2.7:free`
- **Hugging Face text:** `Qwen/Qwen3.8-27B:fastest`
- **OpenRouter TTS:** `fish-audio/s2.1-pro-free:free`

Cloud credentials are server-side environment variables. Harry is the first built-in Character with the live model-backed text/voice configuration; other Characters retain their existing configurations until explicitly migrated.

## Built-in Characters

- Harry
- Hermione
- Ron

Character definitions live under `data/characters/` and follow the independent Character schema.

Custom Characters are currently browser-local and stored through the Character service/localStorage abstraction.

## Voice and Avatar

Voice Chat uses browser `SpeechRecognition` for Persian microphone input, the Character's two configured response-model slots, and a dedicated TTS/output layer. For Harry, the response pair is OpenRouter + Hugging Face and the TTS layer is OpenRouter Fish Audio. Browser TTS remains a fallback. The lip-sync layer currently provides timing-based coordination; production phoneme/viseme lip-sync remains future development.

## Persistence

The current baseline uses browser localStorage for custom Characters, user-facing Character settings, and conversation memory. Database persistence, accounts, and cross-device synchronization are intentionally outside v2.0.0.

## Environment Variables

Copy `.env.example` to `.env` and keep real credentials out of Git.

```env
OPENROUTER_API_KEY="your-openrouter-key"
HUGGING_FACE_TOKEN="your-hugging-face-token"
```

`HF_TOKEN` is also accepted as a compatibility alias. The application reads credentials only on the server.

## Security Baseline

- Provider API keys remain server-side.
- Client requests do not expose provider credentials.
- Character/provider/model validation occurs server-side.
- Chat, TTS, and static endpoints use rate limiting.
- `qs` is pinned/overridden to `6.16.0`.
- Raw provider errors and stack traces are not returned to the UI.

See `SECURITY.md` for the complete policy.

## Development

Requirements: Node.js 20+

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

Production:

```bash
npm run build
npm start
```

## Versioning

WizTalk follows Semantic Versioning:

- **MAJOR** — breaking architecture/API changes
- **MINOR** — backward-compatible feature releases
- **PATCH** — fixes and security/maintenance releases

`v2.0.0` remains the stable release baseline. Post-v2 feature work stays under `Unreleased` until an explicit release version is cut.

## Post-v2 Development Roadmap

1. Expand real AI Model Activation to all built-in Characters
2. Database + Persistence
3. Authentication + User Accounts
4. Memory + Conversation History
5. Real Avatar / Live2D / 3D
6. Advanced Voice + Lip-Sync
7. Moderation & Safety
8. Agent / Tools Architecture
9. Production / Observability / Deployment
10. UX / Product Polish

Each phase must use a new dedicated branch, contain only that phase's scope, pass project checks, and be submitted through a Pull Request. Merging requires explicit project-owner approval.

## Documentation

- `docs/architecture.md` — architecture overview
- `docs/modular-architecture.md` — Avatar, Background, Voice, Lip-Sync, and Character modularity
- `docs/character-system.md` — Character schema and lifecycle
- `docs/voice-system.md` — voice architecture and model-backed TTS
- `docs/memory-system.md` — current memory model
- `docs/ai-providers.md` — provider configuration
- `docs/roadmap.md` — current and future roadmap
- `docs/deployment.md` — deployment
- `docs/development.md` — development workflow
- `CONTRIBUTING.md` — contribution workflow
- `SECURITY.md` — security policy
- `CHANGELOG.md` — release history
- `RELEASE.md` — release baselines

## License

MIT License — see `LICENSE`.

---

**WizTalk v2.0.0 — Stable Release Baseline | Post-v2 Voice/Avatar Work Unreleased**
