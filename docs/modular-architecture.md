# WizTalk: مدول‌سازی Avatar، Voice و Character

## نمای کلی

این نسخه WizTalk معماری کاملاً مدولار برای:
- **سیستم Avatar**: رندرر 2D متحرک مستقل برای هر شخصیت
- **سیستم Voice**: تنظیمات صوتی مستقل برای هر شخصیت
- **معماری Character**: جدایی شرایط تنظیمات per-character
- **Lip-Sync**: آماده‌سازی معماری برای تزامن لب‌های آینده
- **توسعه‌پذیری**: ساختار آماده برای رندررهای آینده و مدل‌های صوتی

## معماری

### 1. سیستم Avatar

#### فایل‌ها:
- `src/services/avatar-controller.ts` - کنترلر انیمیشن Avatar
- `src/services/avatar-renderer.tsx` - رندرر 2D متحرک
- `src/styles/avatar-animations.css` - انیمیشن‌های Tailwind

#### مشخصات:
- **حالت‌ها**: idle, listening, thinking, speaking, error
- **انیمیشن‌های حالت**: fade-subtle, pulse-listening, bounce-thinking, speak, voice-wave, shake-error
- **دارایی‌های مستقل**: هر شخصیت می‌تواند darayi‌های مختلفی داشته باشد
- **تقسیم Rendering**: AvatarRenderer می‌تواند با SVG، Canvas، Live2D یا 3D جایگزین شود

#### استفاده:
```typescript
import { createAvatarController } from './avatar-controller';
import AnimatedAvatarRenderer from './avatar-renderer';

const controller = createAvatarController();
controller.setState('speaking');
controller.subscribeToVoiceEvents((event) => {
  console.log('Voice event:', event);
});
```

### 2. سیستم Voice

#### فایل‌ها:
- `src/services/voice-advanced.ts` - سرویس صوت پیشرفته

#### مشخصات‌های مستقل شخصیت:
```typescript
interface VoiceConfig {
  provider: 'browser' | 'external';
  voiceId?: string;
  language: string;           // fa-IR برای فارسی
  enabled: boolean;
  speechRate?: number;        // 0.5 - 2.0
  pitch?: number;             // 0.5 - 2.0
  volume?: number;            // 0 - 1.0
  voiceName?: string;
}
```

#### استفاده:
```typescript
// Speech-to-Text با تنظیمات شخصیت
const recognition = VoiceService.initSpeechToText(
  character,
  (text) => console.log('Recognized:', text),
  (error) => console.error(error),
  () => console.log('Done')
);

// Text-to-Speech با تنظیمات شخصیت
await VoiceService.speak(
  "سلام!",
  character,
  (voiceEvent) => {
    // برای lip-sync
    lipSyncCoordinator.processVoiceEvent(voiceEvent);
  }
);
```

### 3. معماری Character

#### تنظیمات مستقل برای هر شخصیت:
```json
{
  "id": "harry",
  "name": "Harry Potter",
  "avatar": {
    "type": "animated-2d",
    "source": "...",
    "speakingSource": "...",
    "listeningSource": "...",
    "animationSpeed": "normal"
  },
  "voice": {
    "language": "fa-IR",
    "speechRate": 1.0,
    "pitch": 1.1,
    "volume": 1.0
  },
  "ai": {
    "provider": "local",
    "model": "faq-keyword-v1"
  }
}
```

#### هر شخصیت دارای:
- Avatar مستقل با دارایی‌های خود
- تنظیمات صوتی منحصر به فرد
- مدل AI خود
- حافظه گفت‌وگو جداگانه

### 4. Lip-Sync Architecture

#### فایل:
- `src/services/lipsync-coordinator.ts` - مختص کننده lip-sync

#### مشخصات:
- **Mouth Shapes**: closed, open-small, open-medium, open-large, smile, pursed
- **Amplitude-based Prediction**: پیش‌بینی شکل دهان از نوسان صوتی
- **Phoneme Support**: برای بهبودی‌های آینده
- **SVG Generation**: تولید SVG برای رندررهای 2D/3D

#### آماده‌سازی برای آینده:
- Support برای phoneme detection
- Integration با Live2D
- Support برای 3D character
- External voice provider coordination

### 5. Data Layer

#### فایل‌های شخصیت:
- `data/characters/harry.json`
- `data/characters/ron.json`
- `data/characters/hermione.json`

هر فایل شامل:
- Avatar configuration
- Voice configuration
- AI configuration
- Personality traits

## تدفق کار (Data Flow)

```
User Input
    ↓
Speech Recognition (با character language)
    ↓
Chat Message (گفت‌وگو و حافظه per-character)
    ↓
AI Response Generation
    ↓
Speech Synthesis (با character voice settings)
    ↓
Voice Events → Lip-Sync Coordinator
    ↓
Avatar Animation (state + lip-sync)
    ↓
Display
```

## توسعه و جدایی

### Renderer Abstraction
رندرر کنونی می‌تواند با هر implementation جایگزین شود:
```typescript
// Current: AnimatedAvatarRenderer
// Future: SVGAvatarRenderer
// Future: CanvasAvatarRenderer
// Future: Live2DAvatarRenderer
// Future: ThreeDRenderer
```

### Voice Provider Abstraction
سرویس صوت می‌تواند extended شود:
```typescript
// Current: Browser Web Audio API
// Future: Google Cloud TTS
// Future: Azure Cognitive Services
// Future: ElevenLabs API
```

### Character Extensibility
شخصیت جدید اضافه کردن فقط نیاز به:
1. فایل JSON جدید در `data/characters/`
2. تنظیمات avatar، voice، و AI
3. بدون تغییر در core Chat، AI، یا Avatar logic

## API

### AvatarAnimationController
```typescript
controller.setState(state: AvatarState)
controller.getState(): AvatarState
controller.setTransitionTiming(state, ms)
controller.subscribe(listener): unsubscribe
controller.subscribeToVoiceEvents(listener): unsubscribe
controller.emitVoiceEvent(event)
controller.getStateHistory(limit)
controller.reset()
```

### VoiceService
```typescript
VoiceService.initSpeechToText(character, onResult, onError, onEnd)
VoiceService.startListening()
VoiceService.stopListening()
VoiceService.speak(text, character, onVoiceEvent)
VoiceService.stopSpeaking()
VoiceService.pauseSpeaking()
VoiceService.resumeSpeaking()
VoiceService.getAvailableVoices()
VoiceService.getPersianVoices()
VoiceService.subscribeToVoiceEvents(listener)
```

### LipSyncCoordinator
```typescript
coordinator.processVoiceEvent(event)
coordinator.setAnimationController(controller)
coordinator.subscribe(listener): unsubscribe
coordinator.getCurrentMouthShape()
coordinator.getVoiceEventBuffer(limit)
coordinator.reset()
```

## نسخه اول vs. نسخه بهتر

### قبل:
- Avatar عمومی (یک avatar برای همه)
- Voice سراسری
- تنظیمات ثابت

### الان:
- Avatar مستقل برای هر شخصیت
- Voice مستقل برای هر شخصیت
- تنظیمات کامل per-character
- آماده‌سازی برای lip-sync
- معماری مدولار برای رندررهای آینده

## آینده

### مرحله 1: بهبودی موجود
- [ ] Live2D avatar support
- [ ] Advanced phoneme detection
- [ ] External TTS providers
- [ ] Character animation presets

### مرحله 2: توسعه
- [ ] 3D character rendering
- [ ] Real-time voice modulation
- [ ] Multi-language UI
- [ ] Cloud character storage

### مرحله 3: ویژگی‌های پیشرفته
- [ ] Custom avatar creation
- [ ] Voice cloning
- [ ] Emotion-based animation
- [ ] Multi-character conversations

## تست‌ها

```bash
npm run lint       # TypeScript/ESLint validation
npm run build      # Production build
npm run dev        # Development server
```

## نکات مهم

1. **هر شخصیت مستقل است**: تغییر Harry تاثیری بر Ron ندارد
2. **معماری مدولار**: رندرر یا voice provider می‌تواند بدون تغییر core تعویض شود
3. **آماده‌سازی آینده**: Lip-sync architecture فقط منتظر phoneme detection است
4. **حفاظت درحفظ تابع**: تمام ویژگی‌های موجود محفوظ باقی‌مانده‌اند
5. **فارسی-اول**: تمام ویژگی‌ها فارسی پشتیبانی می‌کنند
