# WizTalk Roadmap

## Baseline: v2.0.0

**Status:** Stable architecture baseline — 2026-09-12

Phase 1–8 are complete and form the initial platform foundation. New development begins from this baseline and is intentionally divided into isolated phases.

## Completed Foundation — Phase 1–8

1. **Avatar Architecture** — controller, renderer-neutral boundaries, states, animation/lip-sync foundation.
2. **Character Data Architecture** — independent Character schema, normalization, and isolation.
3. **Response Manager** — centralized model routing, fallbacks, timeout/error containment, controlled final fallback.
4. **Voice Manager** — centralized voice routing, fallbacks, browser TTS fallback, text preservation.
5. **Character-centric Chat UI** — Avatar-centered experience and speech-bubble response presentation.
6. **Character Settings** — per-Character user-facing settings with internal provider strategy boundaries.
7. **Responsive Pass** — mobile/tablet/desktop layout improvements and regression protection.
8. **Integration & Acceptance** — integration validation of the completed architecture.

## Post-v2 Development Phases

### Phase 9.1 — Real AI Model Activation

Activate and validate real cloud-model usage while preserving the ResponseManager/provider boundaries and server-side credentials.

### Phase 9.2 — Database + Persistence

Introduce database-backed Characters, conversations, messages, and settings with explicit ownership boundaries and migration compatibility.

### Phase 9.3 — Authentication + User Accounts

Introduce users, authentication, sessions, and server-side authorization so personal resources cannot cross user boundaries.

### Phase 9.4 — Real Avatar / Live2D / 3D

Add production-capable Avatar renderers through the existing renderer-neutral architecture.

### Phase 9.5 — Advanced Voice + Lip-Sync

Expand voice/avatar coordination toward amplitude animation and production phoneme/viseme-ready pipelines.

### Phase 9.6 — Memory + Conversation History

Separate short-term context, persistent conversations, long-term memory, and Character-specific memory with bounded retrieval/context.

### Phase 9.7 — Moderation & Safety

Add server-side input/output safety controls, abuse resistance, and safe handling of moderation failures.

### Phase 9.8 — Agent / Tools Architecture

Add controlled server-side tools, permissions, validation, timeouts, and an isolated agent layer without bypassing core response boundaries.

### Phase 9.9 — Production / Observability / Deployment

Add production logging, metrics, correlation IDs, health checks, deployment hardening, and operational visibility.

### Phase 9.10 — UX / Product Polish

Polish Chat, Avatar, Voice, Settings, accessibility, loading/error states, and responsive behavior without leaking infrastructure internals into the user experience.

## Development Rules

- Every phase gets a **new dedicated branch** from the latest `main`.
- A phase branch contains only that phase's scope.
- Do not implement future phases early under the excuse of preparation.
- Preserve Character isolation.
- Preserve ResponseManager and VoiceManager ownership boundaries.
- Run the relevant lint, test, and build checks.
- Submit a Pull Request for review.
- Merge only after explicit project-owner approval.
- Create release tags only from reviewed stable commits.

## Product Direction

The long-term goal is a multi-character Persian-first AI platform in which each Character behaves as an independent hybrid chatbot with its own identity, Avatar, text/voice stack, knowledge, settings, runtime state, history, and memory, while shared infrastructure remains internally reusable and safely isolated.
