# Voice System

VoiceService wraps browser Speech Recognition and Speech Synthesis. It checks support before use, maps common microphone errors to Persian messages, and exposes start, stop, abort, speak, and stopSpeaking operations.

ChatUI transitions AvatarAnimationController through listening, thinking, speaking, idle, and error. Text responses and audio responses remain separate: when TTS is disabled, the avatar still shows a short speaking state without claiming that audio or lip-sync occurred.

Implemented: fa-IR recognition and synthesis where the browser supports them. Limitations: browser permission, browser engine, microphone, and installed voice availability vary. Phoneme-level lip-sync is future work.
