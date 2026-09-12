# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in WizTalk, please use the repository's private security reporting mechanism rather than publishing sensitive details in a public Issue.

When reporting a vulnerability, include:
- Description
- Steps to reproduce
- Potential impact
- Suggested mitigation, if known

## Security Baseline — v2.0.0

WizTalk v2.0.0 is the stable architectural baseline after completion of the initial Phase 1–8 roadmap.

### API Key Management

- `GEMINI_API_KEY`, `OPENAI_API_KEY`, and `OPENROUTER_API_KEY` are server-side credentials.
- Provider credentials must never be exposed to browser code.
- Provider credentials must never be stored in localStorage or committed to source control.
- Client requests identify the Character and message; provider credentials remain behind the server boundary.

### Provider Isolation

AI providers execute through the server-side service layer. `ResponseManager` owns response orchestration and fallback behavior. Raw provider exceptions must not be returned to the UI.

### Character Trust Boundaries

- Built-in Character definitions are trusted repository data.
- Custom Character data is untrusted user-controlled data.
- Character configuration must be validated and normalized before server-side use.
- Custom instructions must not bypass server-side safety controls.
- Character A must never gain access to Character B's private state or configuration.

### Rate Limiting

The current server protects the main API surfaces with rate limiting. Any future public endpoint must receive an explicit rate-limit and abuse-resistance review.

### Input and Output Validation

- Empty or malformed chat requests are rejected.
- Character identifiers are validated server-side.
- Provider/model choices are constrained to supported configurations.
- Conversation history sent to providers is bounded.
- Voice parameters are constrained to safe ranges.
- Provider responses are validated before being accepted by `ResponseManager`.
- Empty/invalid provider responses trigger fallback rather than reaching the UI.

### Voice and Avatar Security

Voice and Avatar event systems run through defined application boundaries. New external voice providers must use server-side credentials and must not introduce direct browser-to-provider secret exposure.

### Data Privacy — Current v2.0.0 State

The current baseline stores custom Characters, user-facing Character settings, and conversation memory in browser-local storage.

Important limitations:

- localStorage is not encrypted storage.
- There is currently no account/authentication system.
- There is currently no database-backed cross-device synchronization.
- Cloud AI providers may receive conversation content when configured and used by the application.

Future database/account phases must introduce explicit user ownership and authorization checks before cloud persistence is considered complete.

### Transport and Deployment

Production deployments should use HTTPS. Environment secrets must be configured through the deployment platform's secret/environment mechanism and must never be committed.

Review CORS, security headers, Content Security Policy, logging, and rate limits before production exposure.

### Dependency Security

- `package-lock.json` is committed and should be kept synchronized with `package.json`.
- `qs` is pinned/overridden to `6.16.0` or newer as appropriate.
- Run dependency audits before releases and security-sensitive changes:

```bash
npm audit
npm run lint
npm test
npm run build
```

Do not blindly apply `npm audit fix` when it would introduce unrelated or breaking dependency changes; review the resulting diff.

## Version Security Policy

- PATCH releases are used for security fixes and maintenance where possible.
- Significant security fixes may require an emergency release.
- Security-impacting changes must be documented in `CHANGELOG.md`.
- Release baselines are recorded in `RELEASE.md`.

## Current Known Security Limitations

v2.0.0 does **not** yet provide:

- user authentication and authorization
- database-backed access control
- encrypted application-level conversation storage
- production moderation layer
- production tool/agent permission architecture

These are planned post-v2 development areas and should not be represented as already implemented.

## Security Review Checklist

Before production-oriented changes:

- [ ] No secrets in source, client bundles, localStorage, or commits.
- [ ] Server-side validation is present.
- [ ] Character/user ownership boundaries are enforced where applicable.
- [ ] Provider errors are contained.
- [ ] Rate limiting is verified.
- [ ] Dependencies are audited.
- [ ] HTTPS is enabled.
- [ ] Security headers/CSP are reviewed.
- [ ] Logs contain no credentials or unnecessary sensitive content.
- [ ] Relevant tests/build checks pass.

## Contact

For the current repository security-reporting mechanism, use GitHub's private security reporting features. Do not publish credentials, exploit details, or sensitive user data in public Issues.

---

**Last Updated:** 2026-09-12 — v2.0.0 baseline
