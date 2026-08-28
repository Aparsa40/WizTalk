# Memory System

V1 uses standard `localStorage` as a fast, offline-capable persistence layer.

## Implementation
Located in `src/services/memory.ts`.
Data is isolated per character (`wiztalk_messages_${characterId}`) to ensure clean context separation.

## Future Path
The MemoryService class methods (e.g., `getMessages`, `saveMessage`) serve as a clean abstraction. Migrating to IndexedDB or a Cloud Database (like Firebase/Supabase) only requires rewriting this class's internal logic, leaving the React components untouched.
