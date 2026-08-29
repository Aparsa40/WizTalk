# Environment

Copy .env.example to .env for local development. Real credentials must stay in the deployment environment and must never be committed.

- GEMINI_API_KEY: optional server-side Gemini credential.
- OPENAI_API_KEY: optional server-side OpenAI credential.
- NODE_ENV: development or production.
- PORT: listening port; defaults to 3000.

There is no client-side provider key field in V1. This prevents cloud credentials from being placed in localStorage or sent in request bodies. If a future version supports user-owned credentials, it must use an explicit secure credential boundary rather than browser persistence.
