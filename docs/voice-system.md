# Voice System

WizTalk separates Voice Chat response models from the final Text-to-Speech renderer.

## Voice Chat pipeline

```text
Microphone
  ↓
Browser Speech Recognition (fa-IR)
  ↓
/api/chat { mode: "voice" }
  ↓
ResponseManager
  ├─ Voice model #1: OpenRouter / MiniMax
  ├─ Voice model #2: Hugging Face / Qwen
  ├─ Character-local knowledge
  └─ Controlled final fallback
  ↓
Text response
  ↓
VoiceManager
  ↓
/api/tts
  ↓
OpenRouter TTS: fish-audio/s2.1-pro-free:free
  ↓
MP3 audio playback
  ↓
Avatar voice events / lip-sync coordination
```

For Harry, the Voice Chat pair is intentionally explicit and independent from the final TTS layer:

- Primary: `openrouter / minimax/minimax-m2.7:free`
- Secondary: `huggingface / Qwen/Qwen3.8-27B:fastest`
- TTS: OpenRouter `fish-audio/s2.1-pro-free:free`

The same model pair is currently used for Harry's text and voice response modes so Character behavior remains consistent. Voice mode does not expose provider credentials to the browser.

## Speech input

The current microphone path uses the browser's `SpeechRecognition` API with `fa-IR`. The browser asks for microphone permission on first activation. This keeps the application lightweight while the server-side response pipeline remains provider-independent.

## Speech output

The primary TTS path is server-side OpenRouter. The API key stays on the server and `/api/tts` returns raw audio bytes to the browser. The free Fish Audio S2.1 Pro model is used for the current development stack. Browser Speech Synthesis remains the final fallback when the model-backed TTS route is unavailable or playback is blocked.

## Failure behavior

- TTS failure never removes the text response from the chat UI.
- Provider errors are logged server-side and replaced with safe UI-level errors.
- Browser TTS remains available as a fallback.
- Voice response-model fallback is handled by `ResponseManager`, not by the TTS layer.

## Limitations

- Browser Speech Recognition support varies by browser and platform.
- The current microphone input is browser STT rather than a dedicated server-side transcription model.
- External audio currently emits timing-based voice events; it does not provide true phoneme/viseme data.
- Full audio-amplitude and production phoneme/viseme lip-sync remain future work.
