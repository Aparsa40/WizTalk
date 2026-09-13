# AI Providers

`server/services/ai.ts` exposes the text-response provider abstraction used by `ResponseManager`. Provider SDKs and credentials remain server-side; browser components never receive API keys.

## Current providers

- **Local** — `faq-keyword-v1`
- **OpenRouter** — `minimax/minimax-m2.7:free`
- **Hugging Face** — `Qwen/Qwen3.8-27B:fastest`

Harry currently uses OpenRouter as Voice/Text response model #1 and Hugging Face as Voice/Text response model #2.

## Credentials

Use environment variables in the server environment:

```env
OPENROUTER_API_KEY="your-openrouter-key"
HUGGING_FACE_TOKEN="your-hugging-face-token"
```

`HF_TOKEN` is also accepted as a compatibility alias. Real credentials must never be committed to Git.

## Voice output provider

TTS is intentionally separate from the response-model provider abstraction. The current Harry configuration uses the OpenRouter speech endpoint through `/api/tts` with:

```text
fish-audio/s2.1-pro-free:free
```

The browser receives only the generated audio bytes. The OpenRouter credential remains on the server. Browser Speech Synthesis is retained as the final fallback.

## Provider routing

`ResponseManager` validates configured model routes against the server-side allow-list. It attempts the primary route first, then the secondary route, then the Character-local response source, and finally the controlled application fallback.

Voice mode uses the Character's `voiceModels.primary` and `voiceModels.secondary` response slots. TTS is executed afterward by `VoiceManager` and is not responsible for choosing the conversational response model.
