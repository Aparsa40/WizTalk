WizTalk Roadmap

Baseline: v2.0.0 — stable release baseline, 2026-09-12.

Post-v2 phases:

1. Real AI Model Activation — in progress.
2. Production Database + Persistence — in progress.
   Implemented: SQLite, authenticated users/sessions, durable chat history, Character-scoped knowledge, startup migrations, transactional SQL migrations, response telemetry, and persistent Render storage.
   Remaining: server persistence for custom Characters and user-owned Character settings; explicit long-term memory tables and retention/deletion policy.
3. Authentication + User Accounts — initial runtime layer is present; ownership hardening continues with persistence.
4. Real Avatar / Live2D / 3D.
5. Advanced Voice + Lip-Sync.
6. Long-term Memory.
7. Moderation & Safety.
8. Agent / Tools Architecture.
9. Production Observability / Deployment.
10. UX / Product Polish.

Development rules:
- Every phase gets a dedicated branch from the latest main.
- Keep phase scope isolated.
- Preserve Character isolation and server-authoritative provider/model selection.
- Run lint, tests, and build.
- Use Pull Requests for review.
- Merge only after explicit project-owner approval.
