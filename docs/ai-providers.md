# AI Providers

server/services/ai.ts exposes a provider abstraction for Local, Gemini, and OpenAI. The client only selects a provider and an allow-listed model; provider SDKs are never imported into browser components.

Local uses keyword matching against data/faq/faqs.json and works without a network or API key. Gemini uses GEMINI_API_KEY. OpenAI uses OPENAI_API_KEY. Both cloud keys are read only by the server.

Models are configuration, not fake installable resources. The /api/models endpoint exposes the current supported model list. Add a provider by implementing its adapter and adding its configuration without changing ChatUI.
