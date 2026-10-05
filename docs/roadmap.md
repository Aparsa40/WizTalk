# WizTalk Roadmap

Baseline: v2.0.0 — stable release baseline, 2026-09-12.
Next release: v2.1.0 — server-authoritative persistence, currently unreleased.

## Post-v2

1. Real AI Model Activation — expand live model-backed routing to all built-in Characters.
2. Production Database + Persistence — implemented for the currently supported persistent application data.
   - SQLite and persistent production storage.
   - authenticated users and sessions.
   - profiles and preferences.
   - custom Characters and Character settings.
   - chat sessions and messages.
   - user/Character-scoped knowledge.
   - response telemetry.
   - transactional startup migrations.
3. Long-term Memory — database foundation exists; memory creation, retrieval, summarization, retention, and deletion are still to be implemented.
4. Real Avatar / Live2D / 3D.
5. Advanced Voice + Lip-Sync.
6. Moderation & Safety.
7. Agent / Tools Architecture.
8. Production Observability / Deployment.
9. UX / Product Polish.

## Development rules

- Every phase gets a dedicated branch from the latest main.
- Keep phase scope isolated.
- Preserve Character isolation and server-authoritative provider/model selection.
- Run lint, tests, and build.
- Use Pull Requests for review.
- Merge only after explicit project-owner approval.
