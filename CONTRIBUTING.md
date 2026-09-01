# Contributing to WizTalk

Thank you for your interest in contributing to WizTalk! ❤️

WizTalk is designed as an extensible AI conversational application with support for configurable characters, avatars, AI services, memory, and voice capabilities.

This document explains the basic workflow for contributing changes safely and consistently.

## Code of Conduct

Please keep all contributions respectful, constructive, and focused on improving the project.

Harassment, abusive behavior, malicious changes, credential exposure, or intentionally harmful code are not acceptable.

## Before You Start

Before making changes:

1. Make sure you have Git installed.
2. Make sure Node.js and npm are installed.
3. Clone the repository.
4. Install project dependencies.
5. Create a dedicated feature or fix branch.

Example:

```bash
git clone https://github.com/Aparsa40/WizTalk.git
cd WizTalk
npm install
```

---
Create a branch:

git checkout -b feature/my-change

For a bug fix:

git checkout -b fix/my-fix
Development

Run the local development server:

npm run dev

Before submitting changes, make sure the project builds successfully:

npm run build

Run available tests with:

npm test

If the project does not currently define a test script, do not add a fake test command. Add or update the appropriate test infrastructure first.

Project Structure

WizTalk separates responsibilities between the user interface, application/domain logic, and services.

When making changes:

Keep UI components focused on presentation and interaction.
Keep business logic outside presentation components where practical.
Keep API communication inside the appropriate service layer.
Do not expose API keys or other secrets to the browser.
Use environment variables for sensitive server-side configuration.
Avoid introducing unnecessary global state.
Prefer reusable components and services.
Keep character configuration separate from character presentation where possible.
Character and Avatar Changes

Changes involving characters or avatars should preserve the application's configurable architecture.

When adding a character:

Use the existing character model and service architecture.
Avoid hard-coding character-specific behavior into generic UI components.
Keep character configuration data separate from UI rendering logic.
Verify character selection, creation, editing, and deletion behavior where applicable.
Check both desktop and responsive layouts.
AI and API Changes

AI-related functionality must not expose provider credentials in client-side code.

Do not:

Commit API keys.
Store API keys in localStorage.
Put secrets directly in React components.
Commit .env files containing real credentials.
Log sensitive credentials.

Use server-side environment variables and the existing service architecture.

Commit Messages

Use clear and descriptive commit messages.

Recommended format:

type: short description

Examples:

feat: add character manager
fix: handle missing avatar configuration
refactor: separate character service
docs: update contribution guidelines
test: add character service tests
chore: update dependencies

Keep commits focused. Avoid combining unrelated changes into a single commit.

Pull Requests

All significant changes should be submitted through a Pull Request.

A good Pull Request should:

Have a clear title.
Explain what changed.
Explain why the change was needed.
Mention important architectural changes.
Include relevant testing information.
Avoid unrelated modifications.

Before opening a Pull Request, verify:

npm install
npm run build

and run the available test and lint commands defined by the project.

Pull Request Checklist

Before submitting:

 Code builds successfully.
 Tests pass, when tests are available.
 No API keys or secrets are committed.
 No unnecessary generated files are committed.
 New functionality is documented when appropriate.
 Existing functionality has been checked for regressions.
 Commit messages are clear.
 The Pull Request description explains the change.
Security

If you discover a security vulnerability, do not disclose sensitive details in a public Issue.

Please follow the instructions in SECURITY.md.

Questions and Improvements

If you are unsure about an architectural decision, document the reasoning in the Pull Request and ask for review before introducing a large structural change.

Thank you for helping make WizTalk better! 🚀