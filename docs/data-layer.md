# Data Layer

Static domain data is kept in data/characters and data/faq. The character loader validates required fields and skips malformed files with a diagnostic server log instead of crashing the whole list.

The client uses CharacterService as the boundary between API data and custom local data. MemoryStore is the persistence contract; LocalStorageMemory is its active V1 adapter.

The model is database-ready but intentionally has no database dependency in V1. A future adapter can persist users, characters, avatars, conversations, messages, settings, providers, models, memory, and voice configuration.
