# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in WizTalk, please email **security@wiztalk.dev** instead of using the issue tracker. This allows us to address the issue before it becomes public knowledge.

When reporting a vulnerability, please provide:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (if available)

We appreciate responsible disclosure and will work with you to resolve security issues promptly.

## Security Practices in WizTalk v1.1.0

### API Key Management (Critical)

**Server-Side Only Implementation**
- All API keys (GEMINI_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY) are handled exclusively on the server
- API keys are **NEVER** exposed to browser code or sent to the frontend
- API keys are **NEVER** stored in localStorage or cookies
- Provider credentials remain protected in server environment variables

**Provider Isolation**
- Each AI provider routes through secure server endpoints
- Client sends only the message and character ID
- Server validates character configuration server-side
- Response is returned to client without exposing provider details

### Character Configuration Security

**Character Data Validation**
- Built-in characters loaded from verified JSON files
- Custom character data from browser is treated as untrusted
- Character system instructions are validated on the server
- Character configurations are sanitized before use

**Trust Levels**
- Built-in characters: Trusted (filesystem source)
- Custom characters: Untrusted (browser-created, localStorage source)
- Custom character system instructions never override server-side safety checks

### Rate Limiting

**API Protection**
- Chat endpoint: 30 requests per 60 seconds per IP
- Static file endpoint: 120 requests per 60 seconds per IP
- Per-IP rate limiting prevents brute force attacks
- Persian error messages for rejected requests

### Input Validation

**Message Validation**
- Empty messages rejected
- Character ID validated as string
- Provider validated against allowed set: 'local', 'gemini', 'openai', 'openrouter'
- Model selection validated against provider's allowed models
- History limited to last 12 messages for context

**Voice Input Validation**
- Speech recognition language constrained to character-specific settings
- Voice parameters (speechRate, pitch, volume) bounded to safe ranges
- Voice ID validated against available system voices

### Architecture Security

**Separation of Concerns**
- Client-side: UI, local state, voice input/output
- Server-side: AI provider integration, character system instructions, API key management
- No mixing of trusted and untrusted data
- Clear trust boundaries

**Future Providers**
- Any new voice provider implementation must follow same server-side key management
- External TTS/STT services must use server-side proxies
- No direct client-to-provider communication

### Data Privacy

**Local Storage**
- Conversation history stored locally in user's browser
- User profile stored locally
- Custom characters stored locally
- No data sent to external services except AI providers (as configured)

**Conversation History**
- Chat messages only sent to configured AI provider
- Messages are not stored by WizTalk on any server
- Users can clear conversation history locally
- Per-character memory isolation

### Transport Security

**HTTPS Recommended**
- Use HTTPS in production
- All API communication should be encrypted in transit
- Environment variables should not be exposed over unsecured channels

**CORS and CSP**
- Server implements appropriate CORS headers
- Content Security Policy recommended for production
- Express middleware hardened against common attacks

### Dependencies

**Package Management**
- Dependencies regularly reviewed for security vulnerabilities
- Lock file (`package-lock.json`) pinned to specific versions
- `qs` package pinned to 6.16.0 or higher for security
- npm audit recommended before deployment

**Vulnerability Scanning**
```bash
npm audit
npm audit fix  # For security patches
```

### Version Security

**v1.1.0 Security Enhancements**
- Voice provider abstraction prevents hardcoding provider details
- Per-character voice configuration doesn't expose provider implementation
- Lip-sync event architecture doesn't leak provider information
- All voice events remain on client side

### Password and Authentication

**Current Status**
- v1.1.0 does not implement authentication
- Future versions should implement:
  - User accounts and login
  - JWT or session-based authentication
  - Password hashing (bcrypt or similar)
  - 2FA support

**Recommendations for Deployment**
- Implement authentication before using in production
- Use OAuth2 for third-party integrations
- Implement user authorization checks
- Audit user access and data

### Error Handling

**Security-Conscious Errors**
- Error messages don't expose internal implementation details
- API errors use generic messages for clients
- Server logs contain detailed error information
- No stack traces exposed to browser

**Persian Error Messages**
- Error messages localized for user clarity
- Error messages don't reveal security details
- User guidance provided without exposing vulnerabilities

### Testing Security

**Recommended Testing**
```bash
# TypeScript type checking
npm run lint

# Build verification
npm run build

# Dependency audit
npm audit

# Manual security review
# - Verify API keys not in code
# - Verify no secrets in git history
# - Verify server-side validation
# - Verify rate limiting works
```

### Deployment Security Checklist

- [ ] All API keys configured as environment variables
- [ ] No secrets in `.env` file (use `.env.example` template)
- [ ] HTTPS enabled for all connections
- [ ] Rate limiting verified in production
- [ ] CORS properly configured
- [ ] Content Security Policy headers set
- [ ] npm audit passed with no vulnerabilities
- [ ] Error logging configured (no sensitive data)
- [ ] Regular dependency updates scheduled
- [ ] Backup strategy for user data
- [ ] Access logs monitored for suspicious activity

### Known Limitations

- **Authentication**: v1.1.0 does not include user authentication (future work)
- **Encryption**: Local storage not encrypted (user's browser is responsible)
- **Provider Validation**: Assumes GEMINI_API_KEY and OPENAI_API_KEY are valid (server trust boundary)
- **Voice Events**: Lip-sync events processed client-side without server oversight

### Reporting a Bug

If you find a non-security bug, please use the [GitHub Issues](https://github.com/Aparsa40/WizTalk/issues) tracker.

For security-related issues, please email directly as described above.

### Security Updates

- Security patches will be released as PATCH versions (x.y.Z)
- Major security issues may trigger emergency releases
- All security updates will be documented in CHANGELOG.md
- Users are encouraged to update frequently

### Contact

**Security Team**: security@wiztalk.dev
**GitHub Issues**: https://github.com/Aparsa40/WizTalk/issues
**Responsible Disclosure**: https://github.com/Aparsa40/WizTalk/security/policy

---

**Last Updated**: 2026-09-06 (v1.1.0)
**Next Review**: Scheduled after major updates or security incidents
