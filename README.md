# WizTalk

WizTalk is a Persian-first, modular interactive AI character platform where people chat with configurable AI characters featuring independent avatars, voice configurations, and advanced animation systems.

**Current Version:** v1.1.0 (Released: 2026-09-06)
**Previous Version:** v1.0.0 (Baseline)
**Status:** Feature Release - Modular Avatar, Voice & Lip-Sync Architecture

## What's New in v1.1.0

### ✨ Major Features

#### 🎭 Modular Avatar System
- **Independent 2D Animated Avatars**: Each character has its own avatar with state-specific assets
- **State-Based Animations**: Idle, listening, thinking, speaking, error states with smooth transitions
- **Pluggable Renderers**: Architecture ready for SVG, Canvas, Live2D, and 3D rendering
- **Visual Feedback**: State indicators (sound waves, pulse rings, thinking bubbles, error states)

#### 🎤 Character-Specific Voice Configuration
- **Per-Character Voice Settings**: Independent language, speech rate, pitch, volume for each character
  - **Harry**: Normal pace, pitch +10% (brave tone)
  - **Hermione**: Faster pace, higher pitch (intelligent tone)
  - **Ron**: Slower pace, lower pitch (casual tone)
- **Persian Language Support**: Full fa-IR (Persian) speech recognition and synthesis
- **Voice Events**: Emission of voice events for lip-sync coordination
- **Future Provider Support**: Architecture ready for external TTS/STT services

#### 🗣️ Lip-Sync Architecture
- **Voice Event Coordination**: Tracks voice playback timing and amplitude
- **Mouth Shape Prediction**: Amplitude-based mouth animation (closed, open-small, open-medium, open-large, smile, pursed)
- **Phoneme Support**: Foundation for future phoneme detection
- **SVG Generation**: Mouth shape rendering for 2D/3D avatars
- **Ready for Live2D/3D**: Clean interfaces for future avatar technology upgrades

#### 🏗️ Character Architecture
- **Complete Decoupling**: Each character has independent configuration for avatar, voice, AI, and memory
- **Easy Extensibility**: Adding new characters requires only adding JSON data, no code changes
- **Character-Specific Memory**: Conversation history stored per character
- **AI Configuration Per Character**: Different characters can use different AI models/providers

### 🎬 Technical Improvements

#### Animation System
- `AvatarAnimationController`: Advanced state management with event emitters
- `AnimatedAvatarRenderer`: CSS-based 2D animations with fallback support
- `avatar-animations.css`: 7+ custom animations for different states
- Smooth state transitions with configurable timing

#### Voice System
- `VoiceService` (Advanced): Character-aware speech recognition and synthesis
- `VoiceEventEmitter`: Coordination between voice, avatar, and lip-sync
- Voice state tracking and pause/resume support
- Persian voice detection and filtering

#### Lip-Sync System
- `LipSyncCoordinator`: Voice-to-animation coordination framework
- Amplitude-based mouth shape prediction
- Ready for phoneme-level analysis
- Support for future external voice providers

## Implemented (v1.0.0 + v1.1.0)

### Core Platform
- ✅ React 19, Vite, TypeScript, Express, Tailwind CSS 4
- ✅ RTL Persian interface with responsive desktop, tablet, mobile layouts
- ✅ Harry, Hermione, and Ron characters with independent configurations
- ✅ Local FAQ mode, Gemini, OpenAI, and OpenRouter provider routing
- ✅ Server-only API keys; no provider secrets exposed to browser/localStorage
- ✅ Browser-local custom character management (create, edit, duplicate, delete)
- ✅ Per-character conversation memory with localStorage
- ✅ Health and model configuration endpoints

### New in v1.1.0
- ✅ Modular 2D animated avatar system with state-specific rendering
- ✅ Character-independent voice configuration system
- ✅ Lip-sync coordination framework ready for future animation
- ✅ Voice event emission and coordination
- ✅ Advanced avatar animation controller with history tracking
- ✅ Character-specific speech rate, pitch, volume control
- ✅ Persian speech recognition with character-specific language settings
- ✅ Mouth shape prediction from voice amplitude
- ✅ Clean renderer/voice provider abstractions for future implementations

## Architecture

### Services Layer
```
src/services/
├── avatar-controller.ts      # Advanced animation state management
├── avatar-renderer.tsx       # 2D animated avatar rendering
├── voice-advanced.ts         # Character-aware voice (STT/TTS)
├── lipsync-coordinator.ts    # Voice-to-mouth animation coordination
├── character.ts              # Character management (create, edit, delete)
├── memory.ts                 # Conversation memory per character
├── api.ts                    # API communication
└── ai.ts                     # AI provider routing
```

### Components Layer
```
src/components/
├── Avatar.tsx                # Avatar display component
├── ChatUI.tsx                # Chat interface (upgraded with new systems)
├── CharacterSelector.tsx     # Character selection
├── CharacterManager.tsx      # Custom character management
├── CharacterForm.tsx         # Character creation/editing
└── Settings.tsx              # Application settings
```

### Server Layer
```
server/services/
├── characters.ts             # Character loading and normalization
├── ai.ts                     # AI provider implementations
└── faq.ts                    # FAQ matching engine
```

### Data Layer
```
data/
├── characters/               # Built-in character definitions
│   ├── harry.json           # Harry (1.1.0: updated with avatar+voice config)
│   ├── hermione.json        # Hermione (1.1.0: updated)
│   └── ron.json             # Ron (1.1.0: updated)
└── faq/
    └── faqs.json            # FAQ dataset for local provider
```

## Setup

**Requirements**: Node.js 20 or newer

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Add API keys only for cloud providers you use (optional):
   - `GEMINI_API_KEY` - For Google Gemini
   - `OPENAI_API_KEY` - For OpenAI
   - `OPENROUTER_API_KEY` - For OpenRouter

3. **Start development**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Development

### Build
```bash
npm run build
```

### Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

The server reads `PORT` from environment (default 3000) and binds to 0.0.0.0.

## Key Differences: v1.0 → v1.1

| Feature | v1.0 | v1.1 |
|---------|------|------|
| Avatar System | Static portrait only | Modular 2D animated with state-based rendering |
| Avatar Configuration | One global avatar | Independent avatar per character |
| Voice System | Basic browser TTS/STT | Advanced per-character voice settings |
| Voice Configuration | Global settings | Independent language, rate, pitch, volume per character |
| Mouth Animation | None | Amplitude-based mouth shape prediction |
| Lip-Sync Architecture | None | Voice event coordination framework ready for phoneme detection |
| Renderer Extensibility | Limited | Clean abstractions for SVG, Canvas, Live2D, 3D |
| Voice Provider Extensibility | None | Architecture ready for external TTS/STT services |
| Character Memory | Per character | Per character (improved per character state tracking) |

## Providers and Models

Local FAQ mode requires no API key. Cloud providers need server-side credentials:

### Local
- **Model**: faq-keyword-v1
- **Key Required**: No
- **Response**: Keyword-matched answers from `data/faq/faqs.json`

### Google Gemini
- **Models**: gemini-2.5-flash, gemini-2.5-pro
- **Key Required**: Yes (`GEMINI_API_KEY`)

### OpenAI
- **Models**: gpt-4o-mini, gpt-4o
- **Key Required**: Yes (`OPENAI_API_KEY`)

### OpenRouter
- **Models**: minimax/minimax-m2.7:free
- **Key Required**: Yes (`OPENROUTER_API_KEY`)

## Character System

Built-in characters (Harry, Hermione, Ron) are static JSON loaded from `data/characters/`.

Each character now has:
- **Independent Avatar**: Type, source, state-specific assets
- **Independent Voice**: Language, speech rate, pitch, volume
- **Independent AI**: Provider and model selection
- **Unique Personality**: Description, behavior, tone, communication style
- **Separate Memory**: Per-character conversation history

Custom characters can be created in the browser and are stored in localStorage. They follow the same independent configuration pattern.

**v1.1.0 Improvement**: Characters are now truly modular. Each character configuration is completely independent; changing one character's settings doesn't affect others.

## Avatar and Voice Rendering

### Avatar
- **2D Animated Renderer**: CSS-based animations with Tailwind utilities
- **State Tracking**: Full animation history available
- **Event Coordination**: Responds to voice events for animation synchronization
- **Fallback Support**: Character initial displayed if image fails to load

The architecture is ready for multiple renderer implementations:
- SVG-based 2D
- Canvas-based 2D/3D
- Live2D support
- Full 3D rendering

### Voice
- **Browser Speech Recognition**: Persian (fa-IR) support
- **Browser Speech Synthesis**: Character-specific voice configuration
- **Voice Events**: Timing information for mouth/facial animation
- **Event History**: Voice event buffer for debugging and replay

The architecture supports future external voice providers without changes to core systems.

## Memory

Per-character conversation memory is stored in localStorage with this structure:
- User and character messages indexed by character ID
- User profile stored separately
- Application state (selected character, provider, model) stored separately

The abstraction layer (`MemoryStore` interface) is ready for database backend without changing application code.

## Lip-Sync (v1.1.0 New)

Lip-sync coordination framework prepares the application for facial animation without requiring complex phoneme analysis today:

- **Mouth Shapes**: Closed, open-small, open-medium, open-large, smile, pursed
- **Amplitude Prediction**: Current amplitude-based shape selection
- **Phoneme Placeholder**: Support for future phoneme detection
- **SVG Generator**: Mouth shape rendering ready for 2D/3D avatars
- **Event Buffer**: Voice event history for timing analysis

Future enhancements:
- Real-time phoneme detection from audio
- Viseme (visual phoneme) mapping
- Live2D parameter binding
- 3D face animation

## Limitations

- Browser voice support varies by browser and OS installed system voices
- Cloud AI providers require server environment variables
- v1.1.0 lip-sync uses amplitude-based prediction (no phoneme analysis)
- Avatar rendering currently uses CSS animations (Live2D/3D future)

## Roadmap

### Phase 2 (Coming)
- [ ] Live2D avatar integration
- [ ] Advanced phoneme detection
- [ ] External voice providers (Google Cloud, Azure, ElevenLabs)
- [ ] Character animation presets and customization
- [ ] Multi-language UI (not just Persian content)

### Phase 3 (Future)
- [ ] 3D character rendering
- [ ] Voice cloning and customization
- [ ] Emotion-based animation states
- [ ] Multi-character group conversations
- [ ] Cloud character and account persistence

## Documentation

- `docs/architecture.md` - System architecture overview
- `docs/modular-architecture.md` - New v1.1 modular systems (Avatar, Voice, Lip-Sync)
- `docs/character-system.md` - Character data and configuration
- `docs/voice-system.md` - Voice and speech systems
- `docs/memory-system.md` - Memory and conversation storage
- `docs/ai-providers.md` - AI provider configuration
- `docs/deployment.md` - Deployment guide
- `docs/development.md` - Development setup

## Support

See `CONTRIBUTING.md` for contributing guidelines.
See `SECURITY.md` for security policies.
See `CHANGELOG.md` for version history.

## License

MIT License - See `LICENSE` for details

---

**Built with ❤️ in Persian**  
WizTalk v1.1.0 - Modular Interactive AI Character Platform
