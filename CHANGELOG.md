# Changelog

All notable changes to WizTalk project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-06

### Added

#### Avatar System (New)
- **Modular 2D Animated Avatar Architecture**
  - `AvatarAnimationController`: Advanced state management with event emitter pattern
  - `AnimatedAvatarRenderer`: CSS-based 2D animated avatar with state-specific rendering
  - State-based animations: idle, listening, thinking, speaking, error
  - Smooth state transitions with configurable timing
  - State history tracking for debugging and replay
  - Voice event subscription for avatar-voice coordination

- **Avatar Features**
  - Visual state indicators: sound waves (speaking), pulse rings (listening), thinking bubbles, error animations
  - Support for state-specific avatar assets (idleSource, listeningSource, speakingSource, etc.)
  - Fallback avatar rendering when images unavailable
  - Responsive sizing (sm, md, lg, xl)
  - Persian language UI labels

- **Tailwind CSS Animations**
  - `fade-subtle`: Idle state subtle breathing animation
  - `pulse-listening`: Listening state pulse with inset glow
  - `bounce-thinking`: Thinking state gentle bounce animation
  - `speak`: Speaking state dynamic scaling animation
  - `voice-wave`: Sound visualization waves
  - `shake-error`: Error state shake feedback
  - `glow-pulse`: Active state glow effect

#### Voice System (Enhanced)
- **Character-Specific Voice Configuration**
  - Independent voice settings per character (language, voiceId, speechRate, pitch, volume)
  - `VoiceService` (Advanced): Character-aware speech recognition and synthesis
  - Character-specific Speech-to-Text (STT) with language configuration
  - Character-specific Text-to-Speech (TTS) with voice parameter control
  - Voice state tracking (isSpeaking, currentUtterance)
  - Pause and resume support for speech synthesis
  - Persian voice detection and filtering
  - Voice event emission for lip-sync coordination

- **Voice Parameters Per Character**
  - `speechRate`: 0.5-2.0 (default 1.0)
  - `pitch`: 0.5-2.0 (default 1.0)
  - `volume`: 0-1.0 (default 1.0)
  - `voiceName`: Optional specific voice selection
  - `language`: fa-IR for Persian, extensible for other languages

- **Harry, Hermione, Ron Character Configurations**
  - Harry: Normal pace (1.0), higher pitch (1.1) - brave tone
  - Hermione: Faster pace (1.15), higher pitch (1.2) - intelligent tone
  - Ron: Slower pace (0.95), lower pitch (0.9) - casual tone

#### Lip-Sync Architecture (New)
- **LipSyncCoordinator**: Voice-to-mouth animation coordination framework
- **Mouth Shape Prediction**: Amplitude-based mouth animation
  - Closed, open-small, open-medium, open-large, smile, pursed
  - Phoneme-aware prediction (extensible)
  - SVG mouth shape generation for 2D/3D rendering
- **Voice Event Coordination**: Tracks voice playback timing and events
- **Event Buffer**: Voice event history for timing analysis and debugging
- **Foundation for Future**: Ready for phoneme detection, Live2D/3D integration

#### Character Architecture
- **Independent Character Configuration**
  - Each character has completely independent avatar configuration
  - Each character has unique voice settings
  - Each character can use different AI models/providers
  - Each character has separate conversation memory
  - No global settings that affect all characters
- **Character Data Enhanced**
  - Avatar: type, source, state-specific sources, animationSpeed
  - Voice: provider, language, speechRate, pitch, volume, voiceName
  - AI: provider, model (unchanged)
  - Memory: Per-character conversation history

#### Type System Enhancements
- New `AvatarType`: portrait, illustration, animated-2d, svg, video, live2d, canvas-3d
- New `VoiceProvider`: browser, external
- New `VoiceEvent`: Voice event interface for coordination
- New `AvatarRenderer`: Interface for pluggable renderer implementations
- New `VoiceEventListener`: Type for voice event subscriptions
- New `LipSyncEvent`: Lip-sync specific event interface
- New `MouthShape`: Type for mouth animation states

#### Documentation
- `docs/modular-architecture.md`: Comprehensive architecture documentation
  - Avatar system architecture and components
  - Voice system with character-specific configuration
  - Character system extensibility
  - Lip-sync coordinator for future animation
  - API endpoints and usage examples
  - Data flow and module interactions
  - Future roadmap and extensibility points

### Changed

#### Character Data Files
- `data/characters/harry.json`: Updated with independent avatar and voice config
- `data/characters/hermione.json`: Updated with independent avatar and voice config
- `data/characters/ron.json`: Updated with independent avatar and voice config

#### Package Metadata
- Version bumped from 1.0.0 to 1.1.0
- Added comprehensive description and keywords
- Updated for Semantic Versioning

#### Architecture
- Avatar system now modular and renderer-agnostic
- Voice system now character-aware and configurable per character
- Character system now supports complete configuration independence
- Services decoupled from rendering and provider implementations

### Preserved (No Breaking Changes)

- ✅ All existing API endpoints functional
- ✅ All providers (Local, Gemini, OpenAI, OpenRouter) working
- ✅ Character loading from JSON files
- ✅ Custom character creation in browser
- ✅ localStorage-based memory system
- ✅ RTL Persian UI
- ✅ Rate limiting and security features
- ✅ Server-side API key management

### Dependencies

No new external dependencies added. All features use existing:
- React 19
- Tailwind CSS 4
- Lucide React (icons)
- Express (server)
- Vite (build tool)
- TypeScript 5.8

### Migration Notes

**For Users:**
- No changes required - all existing functionality preserved
- New avatar animations and voice settings apply automatically
- Custom characters continue to work with enhanced features

**For Developers:**
- New services available: `avatar-controller.ts`, `avatar-renderer.tsx`, `voice-advanced.ts`, `lipsync-coordinator.ts`
- Old services still functional: `avatar.ts`, `voice.ts` (can be deprecated gradually)
- New types in `src/types/index.ts` for extended configuration
- Character data structure extended (backward compatible with v1.0)

---

## [1.0.0] - 2026-09-01

### Added

Initial stable release with:
- React 19, Vite, TypeScript, Express, Tailwind CSS 4
- RTL Persian interface with responsive design
- Harry, Hermione, and Ron characters with personality configuration
- Local FAQ mode, Gemini, OpenAI, OpenRouter provider routing
- Server-side API key management (no browser exposure)
- Character schema with identity, personality, system prompt, AI model, voice, avatar
- Browser-local custom character management (create, edit, duplicate, delete)
- Avatar state controller with idle, listening, thinking, speaking, error states
- Browser Speech Recognition and Speech Synthesis
- Per-character browser memory with localStorage
- Health and model configuration endpoints
- Rate limiting for security
- Comprehensive documentation

### Security
- Server-only provider API keys
- No secrets in browser or localStorage
- Input validation and rate limiting
- Safe character serialization

### Performance
- Vite for fast development and production builds
- Optimized React 19 rendering
- CSS-based animations
- Efficient memory management

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes to API or core functionality
- **MINOR**: New features added backward-compatibly
- **PATCH**: Bug fixes and minor improvements

Current: **v1.1.0** (MINOR release with new modular systems)
Previous: **v1.0.0** (Stable baseline)

## Future Releases

### Planned for v1.2.0
- Live2D avatar integration
- Advanced phoneme detection for lip-sync
- External voice providers (Google Cloud, Azure, ElevenLabs)
- Character animation presets

### Planned for v2.0.0
- 3D character rendering
- Voice cloning capabilities
- Emotion-based animation states
- Multi-character group conversations
- Cloud persistence and accounts
