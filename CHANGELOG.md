# Changelog

All notable changes to the WizTalk project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows Semantic Versioning where applicable.

## [Unreleased]

### Added
- Introduced a structured architecture for WizTalk domains and services.
- Added configurable character management.
- Added character creation and editing capabilities.
- Added character selection functionality.
- Added support for custom character configurations.
- Added a dedicated character management interface.
- Added a more structured AI service layer.
- Added a dedicated memory/service architecture.
- Added a voice service layer for future voice interaction capabilities.
- Added configurable server runtime settings through environment variables.
- Added improved documentation around project architecture and development workflow.

### Changed
- Refactored the application architecture to separate UI, domain models, and service responsibilities.
- Improved the `Avatar` component to support configurable character data and animated presentation.
- Updated `ChatUI` and application-level components to work with the new character architecture.
- Improved application settings to support configurable character and AI behavior.
- Improved backend service organization.
- Improved runtime configuration by removing unnecessary hard-coded server configuration.
- Improved project structure to make future AI, memory, voice, and avatar features easier to extend.

### Security
- Removed the architectural dependency on storing sensitive AI credentials in browser `localStorage`.
- Moved sensitive API communication toward the backend/service layer.
- Improved separation between client-side configuration and server-side secrets.
- Added environment-based configuration for sensitive runtime values.

### Documentation
- Added contribution guidelines.
- Added security reporting guidelines.
- Added changelog documentation.
- Updated project documentation to better reflect the current architecture.

## [0.1.0]

### Added
- Initial WizTalk application.
- React-based frontend.
- AI chatbot interface.
- Character/avatar-based conversational experience.
- Persian-language conversational support.
- Initial application settings and chat functionality.

---

## Versioning

WizTalk uses the following versioning convention:

- **MAJOR** — incompatible architectural or API changes.
- **MINOR** — new backward-compatible functionality.
- **PATCH** — backward-compatible bug fixes and small improvements.

[Unreleased]: https://github.com/Aparsa40/WizTalk/compare/main...HEAD
[0.1.0]: https://github.com/Aparsa40/WizTalk/releases/tag/v0.1.0