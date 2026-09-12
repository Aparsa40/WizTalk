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

    // Preserve the configured provider's error as the useful final diagnostic.
    // Browser fallback errors should not hide the original provider failure.
    let firstError = '';

    for (const executor of ordered) {
      try {
        await executor.speak(cleanText, character, onEvent);

        return {
          spoken: true,
          provider: executor.provider,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'voice provider failed';

        if (!firstError) {
          firstError = message;
        }

        console.warn(`Voice provider ${executor.provider} failed`, error);
      }
    }

    return {
      spoken: false,
      provider: 'none',
      error: firstError || 'voice unavailable',
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
    const configured = this.executors.filter(
      (executor) => executor.provider === configuredProvider
    );

    /*
     * Keep injected browser executors.
     *
     * Tests use a browser mock here so VoiceManager can be tested in Node
     * without depending on the real Web Speech API.
     */
    const browserExecutors = this.executors.filter(
      (executor) => executor.provider === 'browser'
    );

    /*
     * If browser is the configured provider, its injected executor is already
     * the primary provider. Otherwise the configured provider runs first and
     * browser becomes the fallback.
     */
    if (configuredProvider === 'browser') {
      if (browserExecutors.length > 0) {
        return browserExecutors;
      }
    } else {
      const fallbackBrowser =
        browserExecutors.length > 0
          ? browserExecutors
          : [
              {
                provider: 'browser' as const,
                speak: (text: string, character: Character, onEvent?: VoiceEventListener) =>
                  VoiceService.speak(text, character, onEvent),
              },
            ];

      return [...configured, ...fallbackBrowser];
    }

    /*
     * No injected browser executor was supplied.
     * Use the real browser TTS implementation as the final voice attempt.
     */
    return [
      {
        provider: 'browser',
        speak: (text, character, onEvent) =>
          VoiceService.speak(text, character, onEvent),
      },
    ];
  }
}

export const voiceManager = new VoiceManager();