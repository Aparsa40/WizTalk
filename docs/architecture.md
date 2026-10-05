# Architecture

WizTalk uses a React/Vite client and an Express server. The server is authoritative for authentication, Character resolution, response generation and durable user data.

## Runtime flow

`text
Browser / ChatUI
      ↓
Express API
      ↓
Authentication / User Ownership
      ↓
Character Resolution
      ├── Built-in Character JSON
      └── User-owned Custom Characters
      ↓
Chat Session / Message Persistence
      ↓
ResponseManager
      ├── Character-owned model route
      ├── provider fallback
      ├── local knowledge
      └── controlled final fallback
      ↓
Persist Response Log
      ↓
Chat Message Persistence
      ↓
Client
`

## Persistence architecture

`text
React Client
  │
  └── ApiService
        │
        ▼
Express Server
  ├── Auth
  ├── Character Service
  ├── Chat Sessions
  ├── User Data
  ├── Knowledge
  └── Response Manager
        │
        ▼
   SQLite / WAL
        ├── users
        ├── sessions
        ├── chat_sessions
        ├── chat_messages
        ├── response_logs
        ├── user_profiles
        ├── user_preferences
        ├── custom_characters
        ├── character_settings
        ├── memories
        └── knowledge_documents
`

Schema changes are managed through `server/database/migrations/` and executed transactionally at startup.

## Current status

Implemented: authentication and server-side sessions, user-owned chat sessions/messages, durable response logs, user profiles/preferences, account-owned custom Characters, per-user Character settings, and startup database migrations.

Not yet claimed as complete: automatic long-term memory extraction/retrieval, multi-instance PostgreSQL deployment, and production Live2D/3D Avatar rendering.
