# Memory System

WizTalk separates durable conversation history from the future long-term memory layer.

## Conversation history

Chat sessions and messages are persisted server-side in SQLite.

- chat_sessions belongs to an authenticated user and Character.
- chat_messages belongs to a chat session.
- the authenticated API is the source of truth.
- sessions can be restored across browser sessions and devices using the account.

## Long-term memory

The database now contains a memories table with user and Character ownership fields. The table is a foundation for a future long-term memory feature.

It is not yet populated or automatically retrieved by ResponseManager.

Future memory behavior should add explicit creation/update/deletion rules, bounded retrieval, summarization, and retention policies without mixing long-term memory with the raw chat transcript.

## Client state

The obsolete browser-local conversation memory store has been removed. User profile, preferences, custom Characters, and Character settings use authenticated server APIs.
