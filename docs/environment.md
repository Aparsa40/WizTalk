# Environment

Copy .env.example to .env for local development. Real credentials must stay in the deployment environment and must never be committed.

- GEMINI_API_KEY: optional server-side Gemini credential.
- OPENAI_API_KEY: optional server-side OpenAI credential.
- OPENROUTER_API_KEY: server-side OpenRouter credential.
- HUGGING_FACE_TOKEN: server-side Hugging Face credential.
- NODE_ENV: development or production.
- PORT: listening port; defaults to 3000.
- WIZTALK_DB_PATH: SQLite database path; defaults to data/wiztalk.sqlite. Production Render uses /data/wiztalk.sqlite.

Provider credentials never belong in browser storage or user database records. Account-owned application state is persisted through the server API.
