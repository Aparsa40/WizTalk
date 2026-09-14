import { Character, VoiceEvent, VoiceProvider } from '../types';
import { VoiceService, VoiceEventListener } from './voice-advanced';

export interface VoiceExecutor {
  provider: VoiceProvider;
  speak(
    text: string,
    character: Character,
    onEvent?: VoiceEventListener
  ): Promise<void>;
}

export interface VoiceResult {
  spoken: boolean;
  provider: VoiceProvider | 'none';
  error?: string;
}

/**
 * TTS execution only. Voice response-model fallback is owned by ResponseManager.
 * The primary external TTS route is server-side OpenRouter; browser TTS remains
 * the final client-side fallback so a provider outage never removes the text reply.
 *
 * When executors are injected, they are treated as the complete execution chain.
 * This keeps unit tests and future provider adapters deterministic and prevents a
 * failed injected executor from unexpectedly invoking a real network/browser API.
 */
export class VoiceManager {
  private readonly executors: VoiceExecutor[];
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;

  constructor(executors: VoiceExecutor[] = []) {
    this.executors = executors.length
      ? executors
      : [this.externalExecutor(), this.browserExecutor()];
  }

  async speak(
    text: string,
    character: Character,
    onEvent?: VoiceEventListener
  ): Promise<VoiceResult> {
    const cleanText = text.trim();
    const output = character.voiceModels.output;

    if (!cleanText || !output.enabled) {
      return { spoken: false, provider: 'none' };
    }

    const configured = this.executors.filter((executor) => executor.provider === output.provider);
    const browser = this.executors.filter((executor) => executor.provider === 'browser');
    const ordered = output.provider === 'browser'
      ? (browser.length ? browser : this.executors.filter((executor) => executor.provider === 'browser'))
      : [...configured, ...browser];

    for (const executor of ordered) {
      try {
        await executor.speak(cleanText, character, onEvent);
        return { spoken: true, provider: executor.provider };
      } catch (error) {
        console.warn(`Voice output provider ${executor.provider} failed`, error);
      }
    }

    return { spoken: false, provider: 'none', error: 'voice output unavailable' };
  }

  stop(): void {
    this.stopExternalAudio();
    VoiceService.stopSpeaking();
  }

  abortListening(): void {
    VoiceService.abortListening();
  }

  stopListening(): void {
    VoiceService.stopListening();
  }

  initSpeechToText(
    character: Character,
    onResult: (text: string) => void,
    onError: (message: string) => void,
    onEnd: () => void
  ) {
    return VoiceService.initSpeechToText(character, onResult, onError, onEnd);
  }

  startListening(): boolean {
    return VoiceService.startListening();
  }

  isSpeechRecognitionSupported(): boolean {
    return VoiceService.isSpeechRecognitionSupported();
  }

  private externalExecutor(): VoiceExecutor {
    return {
      provider: 'external',
      speak: (text, character, onEvent) => this.speakExternal(text, character, onEvent),
    };
  }

  private async speakExternal(
    text: string,
    character: Character,
    onVoiceEvent?: VoiceEventListener
  ): Promise<void> {
    this.stopExternalAudio();

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`TTS endpoint returned ${response.status}`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.playbackRate = Math.min(2, Math.max(0.5, character.voiceModels.output.speechRate ?? character.voiceModels.output.rate ?? 1));
    audio.volume = Math.min(1, Math.max(0, character.voiceModels.output.volume ?? 1));

    this.currentAudio = audio;
    this.currentAudioUrl = audioUrl;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        onVoiceEvent?.({
          type: 'end',
          characterId: character.identity.id,
          timestamp: Date.now(),
          source: 'external',
          measured: false,
          amplitude: 0,
        });
        resolve();
      };

      audio.onplay = () => {
        onVoiceEvent?.({
          type: 'start',
          characterId: character.identity.id,
          timestamp: Date.now(),
          source: 'external',
          measured: false,
          amplitude: 0.55,
        });
      };
      audio.onended = finish;
      audio.onerror = () => {
        if (settled) return;
        settled = true;
        reject(new Error('external TTS audio playback failed'));
      };

      void audio.play().catch((error) => {
        if (settled) return;
        settled = true;
        reject(error);
      });
    });

    this.releaseExternalAudio();
  }

  private stopExternalAudio(): void {
    this.currentAudio?.pause();
    if (this.currentAudio) this.currentAudio.currentTime = 0;
    this.releaseExternalAudio();
  }

  private releaseExternalAudio(): void {
    this.currentAudio?.removeAttribute('src');
    this.currentAudio?.load();
    this.currentAudio = null;

    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
  }

  private browserExecutor(): VoiceExecutor {
    return {
      provider: 'browser',
      speak: (text, character, onEvent) => VoiceService.speak(text, character, onEvent),
    };
  }
}

export const voiceManager = new VoiceManager();
