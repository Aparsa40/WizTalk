# Changelog

All notable changes to WizTalk are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Voice Model Stack v1

### Added

- Activated Harry's live response-model pair for both text and Voice Chat modes.
- OpenRouter primary response model: `minimax/minimax-m2.7:free`.
- Hugging Face secondary response model: `Qwen/Qwen3.8-27B:fastest`.
- Added server-side `/api/tts` endpoint for model-backed speech output.
- Added OpenRouter Fish Audio `fish-audio/s2.1-pro-free:free` as the current free TTS engine.
- Added external-audio playback in `VoiceManager` with browser TTS fallback.
- Added `HUGGING_FACE_TOKEN` environment variable documentation while retaining `HF_TOKEN` compatibility.

### Changed

- Harry's `voiceModels` now explicitly contains the OpenRouter primary and Hugging Face secondary response routes.
- Harry's TTS output provider is now `external` instead of browser-only.
- Voice documentation now distinguishes Voice Chat response models from the final TTS engine.
- README now reflects the live model-backed voice pipeline.

### Preserved

- Browser `fa-IR` Speech Recognition remains the current microphone/STT layer.
- Text responses remain visible even when TTS fails.
- Browser Speech Synthesis remains the final voice-output fallback.
- Provider credentials remain server-side.

### Known Limitations

- Browser Speech Recognition support varies by browser and platform.
- The current microphone input is not yet routed through a dedicated server-side transcription model.
- External TTS currently provides timing-based avatar events rather than true phoneme/viseme data.
- The free TTS model is intended for development/prototyping and does not provide production availability guarantees.

## [2.0.0] - 2026-09-12

### Added

- Completed the initial eight-phase architecture roadmap.
- Independent Character architecture covering identity, avatar, voice, AI route, knowledge, settings, and memory boundaries.
- Central `ResponseManager` with configured-route-first execution, provider fallback, local knowledge fallback, timeout handling, empty-response handling, and controlled final fallback.
- Central `VoiceManager` with configured voice route, fallback handling, browser TTS fallback, and text-preserving failure behavior.
- Character-centric Chat UI with Avatar as the visual anchor and latest Character response presented near the Avatar.
- Per-Character user settings for display information, Avatar, and voice configuration.
- Responsive mobile/tablet/desktop behavior across the main Character and Chat surfaces.
- Integration and acceptance coverage for the completed architecture.
- Dedicated post-v2 roadmap for real AI activation, persistence, accounts, memory, avatars, voice/lip-sync, moderation, tools, observability, and UX.

### Changed

- Project version advanced from `1.1.0` to `2.0.0`.
- README and release documentation now describe v2.0.0 as the stable architecture baseline rather than a feature-in-progress release.
- Versioning policy now treats v2.0.0 as the starting point for the next generation of product development.
- Roadmap was reorganized around isolated post-v2 development phases.
- Contribution guidance now requires isolated phase branches and Pull Requests for significant work.
- Security documentation now reflects the completed v2 architecture and explicitly records current limitations such as browser-local persistence and lack of authentication.

### Architecture Baseline

The completed Phase 1–8 flow is:

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
→ Configured Provider
→ Provider Fallbacks
→ Local Knowledge
→ Controlled Final Fallback

Voice
→ VoiceManager
→ Configured Voice
→ Voice Fallback
→ Browser TTS
→ Avatar/Lip-Sync events
```

### Preserved

- Persian RTL-first UI.
- Harry, Hermione, and Ron built-in Characters.
- Custom Character management.
- Local FAQ provider.
- Gemini, OpenAI, and OpenRouter provider adapters.
- Server-side provider credentials.
- Browser STT/TTS fallback behavior.
- Character-scoped browser memory.
- Existing rate limiting and dependency security controls.

### Known Limitations at v2.0.0

- Built-in Characters currently default to the local FAQ route; cloud AI adapters exist but are not yet the product's default live model experience.
- Persistence is browser-local; there is no database, account system, or cross-device synchronization.
- Avatar abstraction is ready for richer renderers, but production Live2D/3D/video renderers are future work.
- Lip-sync currently provides coordination/amplitude foundations rather than full phoneme/viseme analysis.
- Production moderation and tool/agent integrations are future phases.
- Browser speech capabilities depend on the user's browser and installed system voices.

### Release Role

`v2.0.0` is a **stable architectural baseline and safe rollback point**. It marks the end of the initial Phase 1–8 foundation and the beginning of post-baseline product development.

---

## [1.1.0] - 2026-09-06

### Added

#### Avatar System
- Modular 2D animated Avatar architecture.
- State-based animations: idle, listening, thinking, speaking, error.
- Pluggable renderer architecture for future SVG, Canvas, Live2D, and 3D implementations.

#### Voice System
- Character-specific voice configuration.
- Persian STT/TTS configuration.
- Voice state tracking and voice events for animation coordination.

#### Lip-Sync Architecture
- `LipSyncCoordinator` foundation.
- Amplitude-based mouth-shape prediction.
- Voice event timing and extensibility for future phoneme detection.

#### Character Architecture
- Independent Avatar and Voice configuration per Character.
- Character-specific AI configuration and memory boundaries.
- Backward-compatible character data normalization.

### Changed

- Version bumped from 1.0.0 to 1.1.0.
- Avatar, Voice, and Character services were modularized.

---

## [1.0.0] - 2026-09-01

### Added

Initial stable release with:
- React 19, Vite, TypeScript, Express, and Tailwind CSS 4.
- Persian RTL interface.
- Harry, Hermione, and Ron Characters.
- Local FAQ, Gemini, OpenAI, and OpenRouter provider routing.
- Server-side API key management.
- Character schema with identity, personality, AI, voice, and avatar data.
- Browser-local custom Character management.
- Avatar state controller.
- Browser Speech Recognition and Speech Synthesis.
- Per-Character browser memory.
- Health and model configuration endpoints.
- Rate limiting and security documentation.

---

## Versioning

- **MAJOR**: breaking API, data, or architecture changes.
- **MINOR**: backward-compatible features.
- **PATCH**: fixes, security patches, and maintenance.

Current baseline: **v2.0.0**

Previous releases: **v1.1.0**, **v1.0.0**

## Post-v2 Planned Phases

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
