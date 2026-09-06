import { Character, VoiceConfig, VoiceEvent } from '../types';

export interface VoiceRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

type VoiceRecognitionConstructor = new () => VoiceRecognition;

export type VoiceEventListener = (event: VoiceEvent) => void;

/**
 * Advanced Voice Service with character-specific configuration
 * 
 * Features:
 * - Per-character voice settings (voiceId, language, speechRate, pitch, volume)
 * - Browser Speech Recognition (STT) with fa-IR support
 * - Browser Speech Synthesis (TTS) with state tracking
 * - Voice event emissions for avatar and lip-sync synchronization
 * - Error handling with Persian error messages
 * - Support for future external voice providers
 */
export class VoiceService {
  private static recognition: VoiceRecognition | null = null;
  private static voiceListeners = new Set<VoiceEventListener>();
  private static isSpeaking = false;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  /**
   * Check if browser supports Speech Recognition
   */
  static isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(this.getRecognitionConstructor());
  }

  /**
   * Get Speech Recognition constructor (supports both webkit and standard)
   */
  private static getRecognitionConstructor(): VoiceRecognitionConstructor | null {
    if (typeof window === 'undefined') return null;
    const browserWindow = window as Window & {
      SpeechRecognition?: VoiceRecognitionConstructor;
      webkitSpeechRecognition?: VoiceRecognitionConstructor;
    };
    return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null;
  }

  /**
   * Initialize Speech-to-Text (STT) with character-specific configuration
   * 
   * @param character - Character with voice configuration
   * @param onResult - Callback when speech is recognized
   * @param onError - Callback on error
   * @param onEnd - Callback when recognition ends
   * @returns Recognition object or null if not supported
   */
  static initSpeechToText(
    character: Character,
    onResult: (text: string) => void,
    onError: (message: string) => void,
    onEnd: () => void
  ): VoiceRecognition | null {
    const Constructor = this.getRecognitionConstructor();
    if (!Constructor) {
      onError('مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند.');
      return null;
    }

    const recognition = new Constructor();
    // Use character-specific voice language
    recognition.lang = character.voice.language || 'fa-IR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: unknown) => {
      const resultEvent = event as {
        results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
      };
      const text = resultEvent.results?.[0]?.[0]?.transcript?.trim();
      if (text) onResult(text);
    };

    recognition.onerror = (event) => {
      onError(this.describeRecognitionError(event.error));
    };

    recognition.onend = onEnd;

    this.recognition = recognition;
    return recognition;
  }

  /**
   * Get descriptive error message for speech recognition errors
   */
  private static describeRecognitionError(error?: string): string {
    const errorMessages: Record<string, string> = {
      'not-allowed': 'اجازه‌ی دسترسی به میکروفون داده نشد.',
      'service-not-allowed': 'سرویس تشخیص گفتار غیرفعال است.',
      'audio-capture': 'میکروفون پیدا نشد یا در دسترس نیست.',
      'no-speech': 'صدایی دریافت نشد؛ دوباره تلاش کنید.',
      'network': 'خطای شبکه در تشخیص گفتار.',
      'bad-grammar': 'خطا در تحلیل صوت.',
    };
    return errorMessages[error || ''] || 'خطا در تشخیص گفتار.';
  }

  /**
   * Start listening for speech input
   */
  static startListening(): boolean {
    if (!this.recognition) return false;
    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.warn('Could not start speech recognition', error);
      return false;
    }
  }

  /**
   * Stop listening for speech input
   */
  static stopListening(): void {
    try {
      this.recognition?.stop();
    } catch (error) {
      console.warn('Could not stop speech recognition', error);
    }
  }

  /**
   * Abort current speech recognition session
   */
  static abortListening(): void {
    try {
      this.recognition?.abort();
    } catch (error) {
      console.warn('Could not abort speech recognition', error);
    }
  }

  /**
   * Check if browser supports Speech Synthesis (TTS)
   */
  static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Check if currently speaking
   */
  static isSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Speak text using character-specific voice configuration
   * 
   * @param text - Text to speak
   * @param character - Character with voice configuration
   * @param onVoiceEvent - Callback for voice events (for lip-sync)
   * @returns Promise that resolves when speech ends
   */
  static speak(
    text: string,
    character: Character,
    onVoiceEvent?: VoiceEventListener
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSpeechSynthesisSupported()) {
        reject(new Error('مرورگر شما از تبدیل متن به گفتار پشتیبانی نمی‌کند.'));
        return;
      }

      const synthesis = window.speechSynthesis;
      synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voiceConfig = character.voice;

      // Apply character-specific voice configuration
      utterance.lang = voiceConfig.language || 'fa-IR';
      utterance.rate = voiceConfig.speechRate ?? 1;
      utterance.pitch = voiceConfig.pitch ?? 1;
      utterance.volume = voiceConfig.volume ?? 1;

      // Select voice based on character's voiceId or voiceName
      const voices = synthesis.getVoices();
      if (voiceConfig.voiceId) {
        const selectedVoice = voices.find(
          (v) => v.voiceURI === voiceConfig.voiceId
        );
        if (selectedVoice) utterance.voice = selectedVoice;
      } else if (voiceConfig.voiceName) {
        const selectedVoice = voices.find((v) => v.name === voiceConfig.voiceName);
        if (selectedVoice) utterance.voice = selectedVoice;
      } else {
        // Fallback: find voice matching language
        const languageVoice = voices.find((v) =>
          v.lang.toLowerCase().startsWith(voiceConfig.language?.slice(0, 2).toLowerCase() || 'fa')
        );
        if (languageVoice) utterance.voice = languageVoice;
      }

      // Emit voice events for lip-sync synchronization
      const emitEvent = (type: VoiceEvent['type']) => {
        const event: VoiceEvent = {
          type,
          characterId: character.id,
          timestamp: Date.now(),
          duration: utterance.toString().length * 50, // Rough estimate
        };
        onVoiceEvent?.(event);
        this.voiceListeners.forEach((listener) => listener(event));
      };

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.currentUtterance = utterance;
        emitEvent('start');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        emitEvent('end');
        resolve();
      };

      utterance.onpause = () => {
        emitEvent('pause');
      };

      utterance.onresume = () => {
        emitEvent('resume');
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        reject(new Error('پخش صدای پاسخ ناموفق بود.'));
      };

      synthesis.speak(utterance);
    });
  }

  /**
   * Stop speaking immediately
   */
  static stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  /**
   * Pause current speech
   */
  static pauseSpeaking(): void {
    if (this.isSpeechSynthesisSupported() && this.isSpeaking) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  static resumeSpeaking(): void {
    if (this.isSpeechSynthesisSupported() && this.isSpeaking) {
      window.speechSynthesis.resume();
    }
  }

  /**
   * Get available voices for voice selection
   */
  static getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSpeechSynthesisSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  /**
   * Get Persian language voices
   */
  static getPersianVoices(): SpeechSynthesisVoice[] {
    return this.getAvailableVoices().filter((voice) =>
      voice.lang.toLowerCase().startsWith('fa')
    );
  }

  /**
   * Subscribe to voice events for coordination with avatar/lip-sync
   */
  static subscribeToVoiceEvents(listener: VoiceEventListener): () => void {
    this.voiceListeners.add(listener);
    return () => this.voiceListeners.delete(listener);
  }

  /**
   * Get current voice configuration from character
   */
  static getVoiceConfig(character: Character): VoiceConfig {
    return character.voice;
  }

  /**
   * Update character's voice configuration
   * Note: This updates the Character object; persistence is handled by CharacterService
   */
  static updateVoiceConfig(character: Character, config: Partial<VoiceConfig>): Character {
    return {
      ...character,
      voice: {
        ...character.voice,
        ...config,
      },
    };
  }
}

/**
 * Create a voice event emitter for coordination
 */
export class VoiceEventEmitter {
  private listeners = new Set<VoiceEventListener>();

  subscribe(listener: VoiceEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: VoiceEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  clear(): void {
    this.listeners.clear();
  }
}
