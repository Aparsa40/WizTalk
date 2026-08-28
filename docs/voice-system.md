# Voice System

The Voice System in V1 leverages standard browser APIs to provide an immersive experience without heavy external dependencies.

## Speech-to-Text (STT)
Uses `window.SpeechRecognition` (or webkit prefix). It is configured for Persian (`fa-IR`) input.
Located in `src/services/voice.ts`.
Limitations: Only supported on certain browsers (like Chrome/Edge).

## Text-to-Speech (TTS)
Uses `window.speechSynthesis`. Automatically looks for a Persian voice installed on the user's OS.
Provides verbal feedback for AI responses.
