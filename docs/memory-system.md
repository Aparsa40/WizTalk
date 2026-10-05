# Memory System

WizTalk now separates conversation history from long-term memory.

## Conversation memory

Conversation history is durable server data:

`text
User
  ↓
Authenticated Session
  ↓
Chat Session
  ↓
Chat Messages
  ↓
ResponseManager context
`

The last bounded message window is sent to the provider by ResponseManager; the complete conversation remains in SQLite.

## User memory

`user_profiles` stores durable user-provided profile information such as name, preferred address, interests and notes.

## Character-scoped long-term memory

The `memories` table provides a durable boundary for future extracted facts/preferences:

- `user_id`
- `character_id`
- `kind`
- `content`
- `importance`
- timestamps

The table exists as persistent infrastructure, but automatic memory extraction/retrieval is intentionally not claimed as complete yet.

## Client storage policy

localStorage is no longer the source of truth for messages, profiles, custom Characters, or Character settings. Account-owned state is read and written through the server API.
