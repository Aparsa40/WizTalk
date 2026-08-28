# Data Layer

V1 introduces a conceptual separation between the application logic and data persistence.

## Architecture
- **Static Knowledge**: Served from the backend (`data/characters/`, `data/faq/`).
- **Dynamic State**: Handled by `src/services/memory.ts`.

By isolating all `localStorage` calls inside `MemoryService`, React components never directly manipulate storage. This enables seamless future upgrades to a cloud database (Cloud SQL, Firebase) without modifying the UI layer.
