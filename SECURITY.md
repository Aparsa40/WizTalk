# Security Policy

## Supported Versions

Security fixes are currently focused on the latest development version of WizTalk.

| Version | Supported |
|---|---|
| Latest development version | Yes |
| Older versions | Best effort |

## Reporting a Vulnerability

If you discover a security vulnerability in WizTalk, please do not publicly disclose the vulnerability before it has been reviewed and addressed.

For sensitive security issues, contact the project maintainer privately through the repository's available private communication channels.

GitHub repository:

https://github.com/Aparsa40/WizTalk

When reporting a vulnerability, provide as much useful information as possible, including:

- A short description of the vulnerability.
- The affected component or file.
- Steps required to reproduce the issue.
- The potential security impact.
- Any relevant logs or screenshots that do not contain secrets.
- A suggested mitigation, if known.

## Do Not Include Secrets

Never include the following in a public Issue, Pull Request, or bug report:

- API keys.
- Access tokens.
- Passwords.
- Session credentials.
- Private keys.
- `.env` files containing real credentials.
- Personal information that is not necessary for reproducing the issue.

If credentials are accidentally exposed, they should be revoked or rotated immediately.

## Security Principles
WizTalk follows these basic security principles:

### 1. Server-Side Secrets
Sensitive API credentials must remain on the server side.

**API keys must not be**:
- Hard-coded in source code.
- Stored in browser `localStorage`.
- Exposed through publicly accessible client-side configuration.
- Committed to Git.

Use environment variables for server-side secrets.

### 2. Client/Server Separation

The frontend should communicate with protected services through the appropriate backend/service layer.

Sensitive provider credentials should never be required by the browser.

### 3. Environment Configuration

Local secrets should be stored using environment configuration files that are excluded from version control.

Example:

```text
.env
.env.local
```

**Real credentials must never be committed to the repository**.


### 4. Dependency Security
Project dependencies should be kept reasonably up to date.

Security-related dependency warnings should be reviewed before being ignored or suppressed.
```bash
Run:
npm audit
when investigating dependency vulnerabilities.
```

### 5. Input Validation

Data received from users, APIs, or external services should be validated before being trusted or processed.
This is especially important for:
Character configuration.
User-generated messages.
API responses.
Server-side configuration.
File or external content processing.

### 6. Logging
Application logs must not expose:
API keys.
Authentication tokens.
Passwords.
Private credentials.
Sensitive user information.
Use appropriate error messages without leaking implementation details to end users.

### Security Updates
#### Security-related changes should:
- Identify the affected component.
- Explain the security impact.
- Apply the smallest appropriate fix.
- Add regression tests where practical.
- Verify that secrets are not exposed.
- Document the change when necessary.
- Responsible Disclosure

**We appreciate responsible security research**.

---
Please allow reasonable time for the issue to be investigated and fixed before publicly disclosing technical details.

**Thank you for helping keep WizTalk secure**.