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
 * Advanced browser voice service.
 *
 * Responsibilities:
 * - Persian STT through browser SpeechRecognition
 * - Character-specific browser TTS configuration
 * - Word/boundary timing events for avatar animation
 * - Voice lifecycle events
 * - Safe fallback when Persian voices are unavailable
 *
 * Important:
 * Browser SpeechSynthesis does NOT expose raw microphone/audio amplitude.
 * Therefore this service does not pretend to provide real amplitude data.
 * Boundary events are used for timing-based lip-sync.
 *
 * A future Piper/local-audio provider can provide real audio amplitude.
 */
export class VoiceService {
  private static recognition: VoiceRecognition | null = null;

  private static voiceListeners = new Set<VoiceEventListener>();

  private static isSpeakingState = false;

  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  private static currentCharacterId: string | null = null;

  private static speechStartedAt = 0;

  // ---------------------------------------------------------------------------
  // Speech Recognition / STT
  // ---------------------------------------------------------------------------

  static isSpeechRecognitionSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      Boolean(this.getRecognitionConstructor())
    );
  }

  private static getRecognitionConstructor():
    | VoiceRecognitionConstructor
    | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const browserWindow = window as Window & {
      SpeechRecognition?: VoiceRecognitionConstructor;
      webkitSpeechRecognition?: VoiceRecognitionConstructor;
    };

    return (
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition ||
      null
    );
  }

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

    recognition.lang = character.voiceModels.default.language || 'fa-IR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: unknown) => {
      const resultEvent = event as {
        results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
      };

      const text = resultEvent.results?.[0]?.[0]?.transcript?.trim();

      if (text) {
        onResult(text);
      }
    };

    recognition.onerror = (event) => {
      onError(this.describeRecognitionError(event.error));
    };

    recognition.onend = () => {
      onEnd();
    };

    this.recognition = recognition;

    return recognition;
  }

  private static describeRecognitionError(error?: string): string {
    const errorMessages: Record<string, string> = {
      'not-allowed': 'اجازه‌ی دسترسی به میکروفون داده نشد.',
      'service-not-allowed': 'سرویس تشخیص گفتار غیرفعال است.',
      'audio-capture': 'میکروفون پیدا نشد یا در دسترس نیست.',
      'no-speech': 'صدایی دریافت نشد؛ دوباره تلاش کنید.',
      network: 'خطای شبکه در تشخیص گفتار.',
      'bad-grammar': 'خطا در تحلیل صوت.',
      aborted: 'تشخیص گفتار متوقف شد.',
    };

    return (
      errorMessages[error || ''] ||
      'خطایی در تشخیص گفتار رخ داد.'
    );
  }

  static startListening(): boolean {
    if (!this.recognition) {
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.warn(
        'Could not start speech recognition:',
        error
      );

      return false;
    }
  }

  static stopListening(): void {
    try {
      this.recognition?.stop();
    } catch (error) {
      console.warn(
        'Could not stop speech recognition:',
        error
      );
    }
  }

  static abortListening(): void {
    try {
      this.recognition?.abort();
    } catch (error) {
      console.warn(
        'Could not abort speech recognition:',
        error
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Speech Synthesis / TTS
  // ---------------------------------------------------------------------------

  static isSpeechSynthesisSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    );
  }

  static isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  /**
   * Speak text using the character's configured browser voice.
   *
   * Boundary events are emitted as small timing units so the avatar can
   * animate its mouth while the browser is speaking.
   */
  static speak(
    text: string,
    character: Character,
    onVoiceEvent?: VoiceEventListener
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSpeechSynthesisSupported()) {
        reject(
          new Error(
            'مرورگر شما از تبدیل متن به گفتار پشتیبانی نمی‌کند.'
          )
        );

        return;
      }

      const cleanText = text.trim();

      if (!cleanText) {
        resolve();
        return;
      }

      const synthesis = window.speechSynthesis;

      // Stop previous speech.
      synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(
        cleanText
      );

      const voiceConfig = character.voiceModels.default;

      utterance.lang = voiceConfig.language || 'fa-IR';

      utterance.rate = this.clamp(
        voiceConfig.speechRate ?? voiceConfig.rate ?? 0.95,
        0.5,
        2
      );

      utterance.pitch = this.clamp(
        voiceConfig.pitch ?? 1,
        0,
        2
      );

      utterance.volume = this.clamp(
        voiceConfig.volume ?? 1,
        0,
        1
      );

      const selectedVoice = this.findBestVoice(
        voiceConfig
      );

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      this.currentUtterance = utterance;
      this.currentCharacterId = character.identity.id;

      let settled = false;

      const finish = () => {
        if (settled) {
          return;
        }

        settled = true;

        this.isSpeakingState = false;
        this.currentUtterance = null;
        this.currentCharacterId = null;

        resolve();
      };

      const fail = (message: string) => {
        if (settled) {
          return;
        }

        settled = true;

        this.isSpeakingState = false;
        this.currentUtterance = null;
        this.currentCharacterId = null;

        reject(new Error(message));
      };

      const emitEvent = (
        type: VoiceEvent['type'],
        extra: Partial<VoiceEvent> = {}
      ) => {
        const event: VoiceEvent = {
          type,
          characterId: character.identity.id,
          timestamp: Date.now(),
          source: 'browser',
          measured: false,
          ...extra,
        };

        onVoiceEvent?.(event);

        this.voiceListeners.forEach((listener) => {
          try {
            listener(event);
          } catch (error) {
            console.warn(
              'Voice event listener failed:',
              error
            );
          }
        });
      };

      utterance.onstart = () => {
        this.isSpeakingState = true;
        this.speechStartedAt = Date.now();

        emitEvent('start', {
          amplitude: 0.45,
          duration: 0,
        });
      };

      /**
       * Browser SpeechSynthesis provides boundary events in many browsers.
       *
       * They are not true phoneme events, but they are useful for making
       * mouth movement follow the speech rhythm.
       */
      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (!this.isSpeakingState) {
          return;
        }

        const elapsed = Math.max(
          0,
          Date.now() - this.speechStartedAt
        );

        const characterIndex =
          typeof event.charIndex === 'number'
            ? event.charIndex
            : 0;

        const boundaryLength =
          typeof event.charLength === 'number'
            ? event.charLength
            : 1;

        const boundaryText = cleanText.slice(
          characterIndex,
          characterIndex + boundaryLength
        );

        const amplitude =
          this.estimateSpeechAmplitude(
            boundaryText
          );

        const phoneme =
          this.estimateMouthPhoneme(
            boundaryText
          );

        emitEvent('resume', {
          amplitude,
          phoneme,
          duration: elapsed,
        });
      };

      utterance.onpause = () => {
        emitEvent('pause', {
          amplitude: 0,
          duration: Date.now() - this.speechStartedAt,
        });
      };

      utterance.onresume = () => {
        emitEvent('resume', {
          amplitude: 0.45,
          duration: Date.now() - this.speechStartedAt,
        });
      };

      utterance.onend = () => {
        emitEvent('end', {
          amplitude: 0,
          duration: Date.now() - this.speechStartedAt,
        });

        finish();
      };

      utterance.onerror = (event) => {
        console.warn(
          'Speech synthesis error:',
          event.error
        );

        emitEvent('end', {
          amplitude: 0,
          duration: Date.now() - this.speechStartedAt,
        });

        fail('پخش صدای پاسخ ناموفق بود.');
      };

      try {
        synthesis.speak(utterance);
      } catch (error) {
        console.warn(
          'Could not start speech synthesis:',
          error
        );

        fail('شروع پخش صدا ناموفق بود.');
      }
    });
  }

  /**
   * Find the best available browser voice for the requested configuration.
   *
   * Priority:
   * 1. Exact voiceURI
   * 2. Exact voice name
   * 3. Exact language
   * 4. Same language
   * 5. Persian voice
   * 6. Any available voice
   */
  private static findBestVoice(
    config: VoiceConfig
  ): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();

    if (voices.length === 0) {
      return null;
    }

    if (config.voiceId) {
      const byId = voices.find(
        (voice) =>
          voice.voiceURI === config.voiceId
      );

      if (byId) {
        return byId;
      }
    }

    if (config.voiceName) {
      const byName = voices.find(
        (voice) =>
          voice.name === config.voiceName
      );

      if (byName) {
        return byName;
      }
    }

    const requestedLanguage = (
      config.language || 'fa-IR'
    ).toLowerCase();

    const exactLanguage = voices.find(
      (voice) =>
        voice.lang.toLowerCase() ===
        requestedLanguage
    );

    if (exactLanguage) {
      return exactLanguage;
    }

    const languagePrefix =
      requestedLanguage.split('-')[0];

    const sameLanguage = voices.find(
      (voice) =>
        voice.lang
          .toLowerCase()
          .startsWith(languagePrefix)
    );

    if (sameLanguage) {
      return sameLanguage;
    }

    const persianVoice = voices.find(
      (voice) =>
        voice.lang
          .toLowerCase()
          .startsWith('fa')
    );

    if (persianVoice) {
      return persianVoice;
    }

    return voices[0];
  }

  /**
   * Estimate a visual speech amplitude from the current boundary text.
   *
   * This is NOT real audio amplitude.
   * It is only a timing/phonetic heuristic for browser TTS.
   */
  private static estimateSpeechAmplitude(
    text: string
  ): number {
    const normalized = text.trim().toLowerCase();

    if (!normalized) {
      return 0.12;
    }

    if (/[\u064b-\u065f\u0670]/.test(normalized)) {
      return 0.65;
    }

    if (
      /[اآأإؤئهعحخغق]/.test(
        normalized
      )
    ) {
      return 0.72;
    }

    if (
      /[اًٌٍَُِ]/.test(
        normalized
      )
    ) {
      return 0.78;
    }

    if (
      /[مبپف]/.test(
        normalized
      )
    ) {
      return 0.42;
    }

    if (
      /[سشزژتدطظث]/.test(
        normalized
      )
    ) {
      return 0.52;
    }

    return 0.58;
  }

  /**
   * Small phonetic heuristic used only to choose a visual mouth shape.
   *
   * This is deliberately simple. Real viseme detection will be introduced
   * when we connect the avatar to actual TTS audio.
   */
  private static estimateMouthPhoneme(
    text: string
  ): string | undefined {
    const normalized = text.trim().toLowerCase();

    if (!normalized) {
      return undefined;
    }

    if (/[مبپ]/.test(normalized)) {
      return 'm';
    }

    if (/[ف]/.test(normalized)) {
      return 'f';
    }

    if (/[وؤ]/.test(normalized)) {
      return 'u';
    }

    if (/[ا]/.test(normalized)) {
      return 'a';
    }

    if (/[یئ]/.test(normalized)) {
      return 'i';
    }

    if (/[هحع]/.test(normalized)) {
      return 'h';
    }

    return undefined;
  }

  // ---------------------------------------------------------------------------
  // Playback controls
  // ---------------------------------------------------------------------------

  static stopSpeaking(): void {
    if (!this.isSpeechSynthesisSupported()) {
      return;
    }

    window.speechSynthesis.cancel();

    this.isSpeakingState = false;
    this.currentUtterance = null;
    this.currentCharacterId = null;
  }

  static pauseSpeaking(): void {
    if (
      this.isSpeechSynthesisSupported() &&
      this.isSpeakingState
    ) {
      window.speechSynthesis.pause();
    }
  }

  static resumeSpeaking(): void {
    if (
      this.isSpeechSynthesisSupported() &&
      this.isSpeakingState
    ) {
      window.speechSynthesis.resume();
    }
  }

  // ---------------------------------------------------------------------------
  // Voice discovery
  // ---------------------------------------------------------------------------

  static getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSpeechSynthesisSupported()) {
      return [];
    }

    return window.speechSynthesis.getVoices();
  }

  static getPersianVoices(): SpeechSynthesisVoice[] {
    return this.getAvailableVoices().filter(
      (voice) =>
        voice.lang
          .toLowerCase()
          .startsWith('fa')
    );
  }

  // ---------------------------------------------------------------------------
  // Event subscription
  // ---------------------------------------------------------------------------

  static subscribeToVoiceEvents(
    listener: VoiceEventListener
  ): () => void {
    this.voiceListeners.add(listener);

    return () => {
      this.voiceListeners.delete(listener);
    };
  }

  static getVoiceConfig(
    character: Character
  ): VoiceConfig {
    return character.voiceModels.default;
  }

  static updateVoiceConfig(
    character: Character,
    config: Partial<VoiceConfig>
  ): Character {
    return {
      ...character,

      voiceModels: { default: { ...character.voiceModels.default, ...config } },
    };
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private static clamp(
    value: number,
    min: number,
    max: number
  ): number {
    return Math.min(
      max,
      Math.max(min, value)
    );
  }
}

/**
 * Generic voice event emitter.
 */
export class VoiceEventEmitter {
  private listeners =
    new Set<VoiceEventListener>();

  subscribe(
    listener: VoiceEventListener
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: VoiceEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.warn(
          'Voice event listener failed:',
          error
        );
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}
