# Memory System

WizTalk separates **conversation history** from browser-local UI state.

## Conversation history

Chat sessions and messages are persisted server-side in SQLite:

- `chat_sessions` belongs to a user and Character.
- `chat_messages` belongs to a chat session.
- The authenticated API is the source of truth.
- Conversation history is restored through `/api/sessions/:sessionId`.

This is durable application memory, not localStorage-backed chat history.

## Client-local state

`src/services/memory.ts` currently stores client-only application state such as selected Character, voice preference, and the legacy user-profile structure. This state is not the source of truth for conversations.

## Future memory layers

Persistent conversation history is the foundation. A separate long-term memory system can later add:

- explicit user memories;
- Character-specific memories;
- bounded retrieval;
- summarization/compaction;
- retention/deletion policies.

Those features should use authenticated server storage and must not leak memory between users or Characters.
