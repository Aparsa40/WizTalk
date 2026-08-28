export class VoiceService {
  private static recognition: any = null;
  
  static initSpeechToText(
    onResult: (text: string) => void, 
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      onError('مرورگر شما از قابلیت تشخیص صدا پشتیبانی نمی‌کند.');
      return null;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'fa-IR';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      onResult(speechResult);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      onError('خطا در تشخیص صدا: ' + event.error);
    };

    this.recognition.onend = () => {
      onEnd();
    };

    return this.recognition;
  }

  static startListening() {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.error(e);
      }
    }
  }

  static stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  static speak(text: string, lang: string = 'fa-IR') {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-speech not supported.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    
    // Try to find a Persian voice, though support varies wildly across OS
    const voices = window.speechSynthesis.getVoices();
    const faVoice = voices.find(v => v.lang.startsWith('fa'));
    if (faVoice) {
      utterance.voice = faVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  static stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
