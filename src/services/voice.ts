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

export class VoiceService {
  private static recognition: VoiceRecognition | null = null;

  static isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(this.getRecognitionConstructor());
  }

  private static getRecognitionConstructor(): VoiceRecognitionConstructor | null {
    if (typeof window === 'undefined') return null;
    const browserWindow = window as Window & { SpeechRecognition?: VoiceRecognitionConstructor; webkitSpeechRecognition?: VoiceRecognitionConstructor };
    return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null;
  }

  static initSpeechToText(onResult: (text: string) => void, onError: (message: string) => void, onEnd: () => void): VoiceRecognition | null {
    const Constructor = this.getRecognitionConstructor();
    if (!Constructor) { onError('مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند.'); return null; }
    const recognition = new Constructor();
    recognition.lang = 'fa-IR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: unknown) => {
      const resultEvent = event as { results?: ArrayLike<ArrayLike<{ transcript?: string }>> };
      const text = resultEvent.results?.[0]?.[0]?.transcript?.trim();
      if (text) onResult(text);
    };
    recognition.onerror = (event) => onError(this.describeRecognitionError(event.error));
    recognition.onend = onEnd;
    this.recognition = recognition;
    return recognition;
  }

  private static describeRecognitionError(error?: string): string {
    if (error === 'not-allowed' || error === 'service-not-allowed') return 'اجازه‌ی دسترسی به میکروفون داده نشد.';
    if (error === 'audio-capture') return 'میکروفون پیدا نشد یا در دسترس نیست.';
    if (error === 'no-speech') return 'صدایی دریافت نشد؛ دوباره تلاش کنید.';
    return 'خطا در تشخیص گفتار.';
  }

  static startListening(): boolean {
    if (!this.recognition) return false;
    try { this.recognition.start(); return true; } catch (error) { console.warn('Could not start speech recognition', error); return false; }
  }

  static stopListening(): void { try { this.recognition?.stop(); } catch (error) { console.warn('Could not stop speech recognition', error); } }
  static abortListening(): void { try { this.recognition?.abort(); } catch (error) { console.warn('Could not abort speech recognition', error); } }

  static isSpeechSynthesisSupported(): boolean { return typeof window !== 'undefined' && 'speechSynthesis' in window; }

  static speak(text: string, language = 'fa-IR', voiceId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSpeechSynthesisSupported()) { reject(new Error('مرورگر شما از تبدیل متن به گفتار پشتیبانی نمی‌کند.')); return; }
      const synthesis = window.speechSynthesis;
      synthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      const voice = synthesis.getVoices().find((item) => voiceId ? item.voiceURI === voiceId : item.lang.toLowerCase().startsWith(language.slice(0, 2).toLowerCase()));
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error('پخش صدای پاسخ ناموفق بود.'));
      synthesis.speak(utterance);
    });
  }

  static stopSpeaking(): void { if (this.isSpeechSynthesisSupported()) window.speechSynthesis.cancel(); }
}
