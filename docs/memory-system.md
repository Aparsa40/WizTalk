# Memory System

MemoryStore defines the persistence contract. LocalStorageMemory is the V1 implementation and stores messages per character under a namespaced key, plus app settings and the user profile.

Reads and writes are guarded against malformed JSON and storage failures. This keeps the UI usable when browser storage is unavailable or corrupted.

Implemented: local persistence and per-character separation. Planned: IndexedDB or a database adapter for larger histories, accounts, and cross-device synchronization.
