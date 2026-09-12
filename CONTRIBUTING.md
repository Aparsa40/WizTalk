# Contributing to WizTalk

Thank you for contributing to WizTalk! ❤️

WizTalk is a Persian-first modular AI character platform. The v2.0.0 release establishes the stable architecture baseline for the next generation of development.

## Development Baseline

The current stable baseline is **v2.0.0**. It contains the completed Phase 1–8 architecture and should be treated as the starting point for new work.

Before changing the project:

1. Update your local `main` from GitHub.
2. Verify the working tree is clean.
3. Read the relevant architecture documentation.
4. Create a dedicated branch for the requested phase or fix.
5. Keep the change limited to its stated scope.

## Phase Branch Policy

Every planned development phase must use a **new dedicated branch** created from the latest `main`.

Recommended naming:

```text
feat/phase-9-real-ai-model-activation
feat/phase-9-database-persistence
fix/security-example
```

Do not implement multiple future phases in one branch merely because they are related.

Each phase should be:

- independently reviewable
- independently testable
- independently mergeable
- independently reversible

## Pull Requests

All significant changes must be submitted through a Pull Request targeting `main`.

A Pull Request should explain:

- what changed
- why it changed
- which phase/scope it belongs to
- important architectural decisions
- tests/checks performed
- known limitations

**Do not merge a phase automatically.** The project owner reviews the PR and explicitly approves the merge.

## Before You Start

```bash
git clone https://github.com/Aparsa40/WizTalk.git
cd WizTalk
npm install
git checkout main
git pull origin main
git checkout -b feat/my-change
```

## Development Commands

```bash
npm run dev
npm run lint
npm test
npm run build
```

Run the commands relevant to your change before opening the PR. Do not invent commands that are not defined by the repository.

## Architecture Rules

### Character isolation

Each Character must remain independently configurable. Do not introduce shared mutable Character configuration or cross-Character state leakage.

### Response architecture

AI response orchestration belongs to `ResponseManager`. Provider adapters should perform provider-specific execution and must not bypass the manager's fallback/error boundary.

### Voice architecture

Voice orchestration belongs to `VoiceManager`. A voice failure must not discard an otherwise valid text response.

### Avatar architecture

Keep Avatar state/control independent from concrete rendering technology. New renderers should integrate through the existing renderer-neutral abstractions.

### Server/client boundary

Keep provider credentials and other secrets server-side. Never put API keys in React code, localStorage, committed `.env` files, or client-visible responses.

### User-facing settings

Provider credentials, internal AI strategy, and other infrastructure details should remain internal unless a specific product phase explicitly makes them user-facing.

## Character and Avatar Changes

When adding or changing a Character:

- use the existing Character schema
- keep Character data separate from UI rendering
- preserve normalization/migration behavior where applicable
- verify Character switching and isolation
- test responsive layouts

When changing Avatar behavior:

- preserve existing states and controller boundaries
- avoid coupling ChatUI directly to a concrete renderer
- verify voice/avatar event coordination

## AI and API Changes

AI-related changes must preserve server-side credential handling.

Never:

- commit API keys
- store API keys in localStorage
- put secrets in React components
- commit real credentials in `.env`
- log credentials or sensitive provider payloads
- expose raw provider exceptions to the browser

## Persistence and User Data

The v2.0.0 baseline currently uses browser-local persistence for custom Characters, user-facing settings, and conversation memory. Future database/account work must preserve explicit user and Character ownership boundaries.

## Commit Messages

Use focused Conventional Commit-style messages:

```text
feat: add character manager
fix: handle missing avatar configuration
refactor: separate character service
docs: update roadmap
test: add response manager coverage
chore: update dependency metadata
```

Avoid mixing unrelated work in one commit.

## Pull Request Checklist

Before submitting:

- [ ] Scope belongs to the declared phase/fix.
- [ ] A dedicated branch was used.
- [ ] No future-phase work was introduced.
- [ ] Character isolation is preserved.
- [ ] ResponseManager/VoiceManager boundaries are preserved where relevant.
- [ ] No secrets are committed.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes when applicable.
- [ ] `npm run build` passes.
- [ ] Documentation is updated when behavior/architecture changes.
- [ ] No unrelated generated files are included.
- [ ] PR description contains testing information and limitations.

## Security

For vulnerabilities, follow `SECURITY.md` rather than opening a public Issue containing sensitive details.

## Questions and Architectural Changes

For a large architectural change, document the reasoning in the PR and keep it isolated from unrelated feature work. If the change belongs to a future roadmap phase, do not pull that phase forward without an explicit project decision.

## License

By contributing, you agree that your contribution is provided under the project's MIT License.
