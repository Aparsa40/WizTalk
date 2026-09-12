# WizTalk

WizTalk is a Persian-first, modular interactive AI character platform. Each Character is designed as an independent hybrid chatbot with its own identity, personality, avatar, voice configuration, AI route, knowledge, settings, and memory boundary.

**Current Version:** v2.0.0 — Architecture Baseline
**Release Date:** 2026-09-12
**Status:** Stable architectural baseline after completion of Phase 1–8

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

This release is a **safe development checkpoint**, not the end of product development. Future work starts from this baseline through isolated feature branches and Pull Requests.

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
Text Response → VoiceManager → Configured Voice → Browser TTS fallback
                           ↓
                     Avatar/Lip-Sync events
```

### Character isolation

Every Character has independent configuration for:
- Identity and personality
- Avatar
- Text model/provider route
- Voice model/settings
- Knowledge
- User-facing settings
- Conversation/memory context

Legacy character data is normalized into the current schema without making provider internals user-editable.

### Response Manager

`ResponseManager` is the central response orchestration layer. It tries the Character's configured route first, then the remaining supported providers, local knowledge, and finally a controlled Persian fallback. Provider failures and raw provider errors remain server-side.

### Voice Manager

`VoiceManager` owns voice orchestration. The configured voice route is attempted first, followed by available fallbacks and browser speech synthesis. A voice failure never removes the text response.

### Avatar architecture

The Avatar system is renderer-neutral and separates Avatar state/control from rendering. Current architecture supports states such as idle, listening, thinking, speaking, and error and is designed for future SVG, Live2D, 3D, and video renderers.

## Current AI Providers and Models

The repository currently contains adapters for:

- **Local:** `faq-keyword-v1`
- **Google Gemini:** `gemini-2.5-flash`, `gemini-2.5-pro`
- **OpenAI:** `gpt-4o-mini`, `gpt-4o`
- **OpenRouter:** `minimax/minimax-m2.7:free`

Cloud credentials are server-side environment variables. Built-in Characters currently use the local FAQ route by default; cloud provider support is implemented but activation/default selection remains a post-v2 development concern.

## Built-in Characters

- Harry
- Hermione
- Ron

Character definitions live under `data/characters/` and follow the independent Character schema.

Custom Characters are currently browser-local and stored through the Character service/localStorage abstraction.

## Voice and Avatar

Current voice support includes browser STT/TTS and per-Character language, rate, pitch, and volume settings. The lip-sync layer provides event coordination and amplitude-based mouth-state support. Production phoneme/viseme lip-sync and real Live2D/3D renderers remain future development.

## Persistence

The current baseline uses browser localStorage for custom Characters, user-facing Character settings, and conversation memory. Database persistence, accounts, and cross-device synchronization are intentionally outside v2.0.0.

## Security Baseline

- Provider API keys remain server-side.
- Client requests do not expose provider credentials.
- Character/provider/model validation occurs server-side.
- Chat and static endpoints use rate limiting.
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

`v2.0.0` is the stable baseline for the next generation of development.

## Post-v2 Development Roadmap

Future development is intentionally divided into isolated phases:

1. Real AI Model Activation
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
- `docs/modular-architecture.md` — Avatar, Voice, Lip-Sync, and Character modularity
- `docs/character-system.md` — Character schema and lifecycle
- `docs/voice-system.md` — voice architecture
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

**WizTalk v2.0.0 — Stable Architecture Baseline**
