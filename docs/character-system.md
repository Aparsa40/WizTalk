# Character System

Characters are defined entirely via JSON files in the `data/characters/` directory.

## Structure
Each file (e.g., `harry.json`) includes:
- Basic Info (ID, Name, Display Name)
- Personality & Role
- System Instructions (Injected into the AI prompt)
- Greeting Message
- Avatar URL

## Extensibility
To add a new character, simply drop a new JSON file into the `data/characters/` folder. The application dynamically scans and loads all available characters.
