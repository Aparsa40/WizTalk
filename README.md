# WizTalk

WizTalk is a Persian-first, local-first conversational application where people chat with configurable AI characters. The V1 implementation keeps the original Harry, Hermione, and Ron experience while making characters, providers, avatars, voice, and memory replaceable modules.

## Implemented
- React 19, Vite, TypeScript, Express, and Tailwind CSS 4.
- RTL Persian interface with responsive desktop, tablet, and mobile layouts.
- Harry, Hermione, and Ron loaded from data/characters JSON files.
- Local FAQ mode, Gemini, and OpenAI provider routing through the server.
- Server-only GEMINI_API_KEY and OPENAI_API_KEY; no provider key is sent to the browser or stored in localStorage.
- Character schema with identity, personality, system prompt, AI model, voice, and avatar configuration.
- Browser-local custom character management: create, edit, duplicate, and delete.
- Avatar state controller with idle, listening, thinking, speaking, and error states.
- Browser Speech Recognition and Speech Synthesis with unsupported-browser and permission error handling.
- Per-character browser memory with a storage abstraction ready for IndexedDB or a database later.
- Health and model configuration endpoints.

## Architecture
- src/components: chat, avatar, settings, character selection, form, and management UI.
- src/services: API, AI configuration, character service, avatar controller, voice service, and memory store.
- src/types: domain contracts independent of persistence.
- server/services: character loading, FAQ matching, and AI provider adapters.
- data: built-in character and local FAQ data.

## Setup
Requirements: Node.js 20 or newer.

1. Install dependencies with npm install.
2. Copy .env.example to .env.
3. Add provider keys only when the matching cloud provider is needed.
4. Start development with npm run dev.
5. Open http://localhost:3000.

## Production
- Build: npm run build
- Start: npm start
- The server reads PORT from the environment and binds to 0.0.0.0. For Render, use build command npm install && npm run build and start command npm start.

## Providers and models
Local uses the FAQ dataset and needs no key. Gemini and OpenAI use server-side credentials. The model list is deliberately allow-listed in server/services/ai.ts; adding a model means changing that configuration rather than pretending to install a model at runtime.

## Character system
Built-in characters are static JSON and read-only in the browser. Custom characters are stored in localStorage and are sent to the server only with their chat request. This is a V1 local architecture; it is not cross-device storage or a shared character catalog.

## Avatar and voice
Avatar is a portrait presentation, not a waveform. AvatarAnimationController separates interaction state from rendering so a future SVG, Canvas, Live2D, 3D, video, or lip-sync renderer can replace the current portrait. Speaking currently uses browser TTS when enabled; amplitude and phoneme lip-sync are planned, not claimed as implemented.

## Memory
LocalStorageMemory is the active implementation behind the MemoryStore interface. Messages are separated per character. A future database adapter can replace the store without changing chat components.

## Limitations and roadmap
- Cloud character persistence, accounts, and cross-device conversations are future work.
- Browser voice support varies by browser and installed system voices.
- Cloud AI providers require server environment variables.
- V1 does not provide phoneme-level lip-sync, moderation, or a local model runtime.

See docs for focused architecture, setup, deployment, data, provider, memory, and voice notes.
