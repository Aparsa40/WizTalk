# AI Providers

WizTalk features a pluggable AI provider architecture:

## 1. Local Provider
- Offline fallback using predefined Q&A from `data/faq/faqs.json`.
- Quick matching based on keyword occurrence.

## 2. Gemini Provider
- Connects securely via the Express backend to Google's Generative AI.
- Requires `GEMINI_API_KEY` in `.env`.
- Default Model: `gemini-2.5-flash`

## 3. OpenAI Provider
- Connects via the OpenAI Node SDK on the Express backend.
- API Key is supplied via the client-side Settings modal for flexible configuration (or easily moved to env).
- Default Model: `gpt-4o-mini`

Adding future providers only requires extending `server.ts` and updating the `Provider` type in `/src/types/index.ts`.
