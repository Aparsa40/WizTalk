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
 * This service receives the final validated text and renders it as speech.
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
    const output = character.voiceModels.output;

    if (!cleanText || !output.enabled) {
      return { spoken: false, provider: 'none' };
    }

    const configured = this.executors.filter((executor) => executor.provider === output.provider);
    const browser = this.executors.filter((executor) => executor.provider === 'browser');
    const ordered = output.provider === 'browser'
      ? (browser.length ? browser : [this.browserExecutor()])
      : [...configured, this.browserExecutor()];

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

  private browserExecutor(): VoiceExecutor {
    return {
      provider: 'browser',
      speak: (text, character, onEvent) => VoiceService.speak(text, character, onEvent),
    };
  }
}

export const voiceManager = new VoiceManager();
