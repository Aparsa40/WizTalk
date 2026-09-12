# WizTalk Release Baselines

This file records stable release checkpoints and their architectural role in the project history.

---

# WizTalk v2.0.0 Release

## Release Information

**Version:** v2.0.0

**Release Date:** 2026-09-12

**Status:** Stable Architecture Baseline

**Baseline Commit:** `6ffe0cf12f3382eae4f65312d751ca7cc513fb34`

## Release Summary

WizTalk v2.0.0 is the completed initial architecture baseline. It consolidates the eight planned foundation phases into one stable point from which the next generation of product development can proceed safely.

## Completed Foundation Phases

### Phase 1 — Avatar Architecture

Established the Avatar controller, renderer-neutral animation boundaries, Avatar states, and the foundation for future renderer implementations.

### Phase 2 — Character Data Architecture

Established independent Character data boundaries covering identity, personality, Avatar, voice, AI configuration, knowledge, settings, and migration/normalization of legacy data.

### Phase 3 — Response Manager

Established centralized response orchestration with configured-provider-first routing, provider fallbacks, local knowledge fallback, timeouts, empty-response handling, and controlled final fallback.

### Phase 4 — Voice Manager

Established centralized voice orchestration with configured voice route, fallback behavior, browser TTS fallback, and text preservation when voice fails.

### Phase 5 — Character-centric Chat UI

Made the Character/Avatar the visual center of the Chat experience while preserving the full conversation history and existing service boundaries.

### Phase 6 — Character Settings

Added per-Character user-facing settings while keeping provider/model strategy and infrastructure concerns internal.

### Phase 7 — Responsive Pass

Validated and improved mobile, tablet, laptop, and desktop layouts without changing the core application architecture.

### Phase 8 — Integration & Acceptance

Completed integration and acceptance validation for the Phase 1–7 architecture and established the project as ready for the next development generation.

## Architecture Validated

```text
Character
├── Identity / Personality
├── Avatar
├── Text Model Route
├── Voice Route
├── Knowledge
├── Settings
└── Memory boundary

Chat
→ API
→ Character Resolution
→ ResponseManager
→ Provider / Fallbacks
→ Local Knowledge
→ Controlled Final Fallback

Voice
→ VoiceManager
→ Voice Provider / Fallback
→ Browser TTS
→ Avatar / Lip-Sync events
```

## Security Baseline

- Provider credentials remain server-side.
- Client requests do not expose provider secrets.
- Custom Character data is treated as untrusted input.
- Provider and Character boundaries are validated server-side.
- Rate limiting remains enabled.
- `qs` is pinned/overridden to `6.16.0`.
- Raw provider exceptions and stack traces are not returned to the UI.

## Current Limitations

v2.0.0 is an architecture baseline, not a finished product release.

- Built-in Characters currently use the local FAQ route by default.
- Cloud AI adapters exist but real production model activation/default strategy is the next development phase.
- Persistence remains browser-local.
- Authentication and accounts are not implemented.
- Cross-device synchronization is not implemented.
- Production Live2D/3D/video renderers are future work.
- Full phoneme/viseme lip-sync is future work.
- Production moderation and Tool/Agent architecture are future work.

## Release Role

`v2.0.0` should be treated as the project's **safe architectural rollback point**. New post-v2 work must branch from the latest `main` descended from this baseline and must remain isolated by phase.

---

# WizTalk v1.1.0 Release

## Release Information

**Version:** v1.1.0

**Release Date:** 2026-09-06

**Status:** Feature Release - Modular Avatar, Voice & Lip-Sync Architecture

## Release Summary

WizTalk v1.1.0 introduced modular Avatar, Voice, Character configuration, and Lip-Sync foundations.

## Architecture Validated

- Modular Avatar state/controller architecture
- Character-specific voice configuration
- Voice event coordination
- Amplitude-based mouth-shape foundation
- Independent Character configuration
- Future renderer/provider extensibility

## Known Limitations

- Browser voice capability depends on browser support.
- Advanced phoneme-level lip-sync remained future work.
- Cloud persistence and user accounts remained future roadmap items.

---

# WizTalk v1.0.0 Release

## Release Information

**Version:** v1.0.0

**Release Date:** 2026-09-01

**Status:** Stable Baseline

## Release Summary

WizTalk v1.0.0 established the first stable foundation for an extensible Persian-first AI conversational platform.

## Architecture Validated

- React + TypeScript frontend
- Vite build system
- Express backend
- AI Provider Layer
- Character Service Architecture
- Environment-based configuration
- Server-side provider credentials
- Browser-local memory

## Known Limitations

- Browser voice capability depended on browser support.
- Advanced avatar lip-sync was future work.
- Cloud persistence and user accounts were future roadmap items.

---

# Release Strategy After v2.0.0

Future development is organized into isolated phases:

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

Every phase should have its own branch, focused commits, automated checks, and a Pull Request. A release tag should only be created from a reviewed stable commit.
