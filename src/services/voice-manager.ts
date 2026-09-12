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
 * Phase 4 voice orchestration boundary.
 *
 * UI code talks only to VoiceManager. Provider-specific browser/external voice
 * behavior stays behind this boundary, which lets a future Piper or remote TTS
 * provider be added without rewriting ChatUI.
 *
 * Failure policy:
 * configured provider -> browser TTS fallback -> text-only result.
 * Voice errors never replace or remove the already-rendered text response.
 */
export class VoiceManager {
  private readonly executors: VoiceExecutor[];

  constructor(executors: VoiceExecutor[] = []) {
    this.executors = executors;
  }

  async speak(
    text: string,
    character: Character,
    onEvent?: VoiceEventListener
  ): Promise<VoiceResult> {
    const cleanText = text.trim();

    if (!cleanText || !character.voiceModels.default.enabled) {
      return { spoken: false, provider: 'none' };
    }

    const configuredProvider = character.voiceModels.default.provider;
    const ordered = this.getOrderedExecutors(configuredProvider);
    let lastError = '';

    for (const executor of ordered) {
      try {
        await executor.speak(cleanText, character, onEvent);
        return {
          spoken: true,
          provider: executor.provider,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'voice provider failed';
        console.warn(`Voice provider ${executor.provider} failed`, error);
      }
    }

    return {
      spoken: false,
      provider: 'none',
      error: lastError || 'voice unavailable',
    };
  }

  stop(): void {
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
    return VoiceService.initSpeechToText(
      character,
      onResult,
      onError,
      onEnd
    );
  }

  startListening(): boolean {
    return VoiceService.startListening();
  }

  isSpeechRecognitionSupported(): boolean {
    return VoiceService.isSpeechRecognitionSupported();
  }

  private getOrderedExecutors(
    configuredProvider: VoiceProvider
  ): VoiceExecutor[] {
    const browser: VoiceExecutor = {
      provider: 'browser',
      speak: (text, character, onEvent) =>
        VoiceService.speak(text, character, onEvent),
    };

    const configured = this.executors.filter(
      (executor) => executor.provider === configuredProvider
    );

    const remaining = this.executors.filter(
      (executor) => executor.provider !== configuredProvider
    );

    const withoutBrowserDuplicates = [...configured, ...remaining].filter(
      (executor) => executor.provider !== 'browser'
    );

    // Browser TTS is the guaranteed client-side fallback currently available.
    return [...withoutBrowserDuplicates, browser];
  }
}

export const voiceManager = new VoiceManager();
