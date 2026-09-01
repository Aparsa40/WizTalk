# Architecture

WizTalk uses a React/Vite client and an Express server. The client owns presentation and browser-local state. The server owns built-in data loading and provider credentials.

The main flow is Character selection, Avatar presentation, Conversation. ChatUI does not contain Harry, Hermione, Ron, or provider-specific API calls. It receives a Character and calls ApiService.

Domain types live in src/types. Storage and external providers are behind services. server/services/characters.ts loads and normalizes JSON. server/services/ai.ts implements the Local, Gemini, and OpenAI adapters. This boundary leaves room for a database adapter and additional providers.

Implemented: modular character, AI, avatar, voice, and memory layers; health and model endpoints; production-aware Express startup.
Planned: authenticated users, shared character storage, database persistence, and real-time collaboration.
