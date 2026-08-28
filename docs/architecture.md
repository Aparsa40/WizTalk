# WizTalk Architecture

## Overview
WizTalk is a local-first, character-based conversational AI web application designed around the Harry Potter universe for its initial release.

## Stack
- Frontend: React 19, Vite, Tailwind CSS, TypeScript
- Backend: Express (Proxying requests securely)
- State Management: Local React State + `localStorage`
- Theming: Custom dark/magical theme, RTL, Vazirmatn font

## Directory Structure
- `src/components/`: Reusable React UI blocks (Avatar, Chat, Settings).
- `src/services/`: Abstractions over APIs, Voice, and Memory.
- `src/types/`: Centralized interfaces.
- `server.ts`: Secure backend for AI Provider routing and serving frontend build.
- `data/`: Local storage for Characters and FAQs.

## Extensibility
The chat engine and AI providers are loosely coupled. The backend securely abstracts OpenAI and Gemini endpoints, enabling easy replacement.
