# WizTalk: مدول‌سازی Avatar، Voice و Character

## نمای کلی

این نسخه WizTalk معماری کاملاً مدولار برای:
- **سیستم Avatar**: رندرر مستقل و renderer-neutral برای هر شخصیت
- **سیستم Background**: دارایی‌های پس‌زمینه مستقل از Avatar برای هر شخصیت
- **سیستم Voice**: تنظیمات صوتی و مسیر پاسخ مستقل برای هر شخصیت
- **معماری Character**: جدایی کامل تنظیمات per-character
- **Lip-Sync**: آماده‌سازی معماری برای هماهنگی صوت و Avatar
- **توسعه‌پذیری**: ساختار آماده برای رندررهای SVG، Live2D، VRM/3D و مدل‌های صوتی

## معماری

### 1. سیستم Avatar

#### فایل‌ها:
- `src/services/avatar-controller.ts` - کنترلر انیمیشن Avatar
- `src/services/avatar-renderer.tsx` - رندرر فعلی 2D
- `src/styles/avatar-animations.css` - انیمیشن‌های Avatar

#### مشخصات:
- **حالت‌ها**: idle, listening, thinking, speaking, error
- **دارایی‌های مستقل**: هر Character می‌تواند چند Avatar asset داشته باشد
- **انتخاب مستقل**: Avatar انتخاب‌شده به Background انتخاب‌شده وابسته نیست
- **Renderer abstraction**: AvatarRenderer می‌تواند با SVG، Canvas، Live2D یا VRM/3D جایگزین شود

### 2. سیستم Background

Background بخشی مستقل از Character است و دیگر به Avatar preset خاصی قفل نیست.

ساختار داده:

```json
{
  "backgrounds": {
    "selectedId": "hogwarts-hall",
    "assets": [
      {
        "id": "hogwarts-hall",
        "name": "Hogwarts • Great Hall",
        "source": "/avatars/harry-hall.svg",
        "position": "center",
        "size": "cover"
      }
    ]
  }
}
```

Character Settings انتخاب Avatar و Background را در کنترل‌های جدا انجام می‌دهد و هر انتخاب مستقل از دیگری ذخیره می‌شود. Legacy avatar/background preset data برای سازگاری حفظ شده است.

### 3. سیستم Voice

#### مشخصات:

Voice Chat فعلی برای Harry از این مسیر استفاده می‌کند:

```text
Microphone
  ↓
Browser Speech Recognition (fa-IR)
  ↓
ResponseManager
  ├─ OpenRouter MiniMax #1
  └─ Hugging Face Qwen #2
  ↓
Text Response
  ↓
VoiceManager
  ↓
OpenRouter Fish Audio TTS
  ↓
Audio → Avatar events
```

این مسیر **end-to-end speech-to-speech نیست**؛ مدل‌های MiniMax و Qwen در این پیکربندی مدل‌های پاسخ متنی هستند و Fish Audio مرحله TTS است. این تفکیک عمداً در معماری و مستندات حفظ شده تا مدل‌های متنی به‌اشتباه به‌عنوان S2S معرفی نشوند.

### 4. معماری Character

هر Character دارای مرز مستقل برای:
- Identity / Personality
- Avatar assets و selected Avatar
- Background assets و selected Background
- Text model/provider route
- Voice response model/provider route
- TTS/output settings
- Knowledge
- Conversation/memory context
- User-facing settings

تغییر Avatar یا Background یک Character نباید تنظیمات Character دیگر را تغییر دهد.

### 5. Lip-Sync Architecture

#### فایل:
- `src/services/lipsync-coordinator.ts` - هماهنگ‌کننده lip-sync

#### مشخصات:
- **Mouth Shapes**: closed, open-small, open-medium, open-large, smile, pursed
- **Timing/Amplitude foundation** برای هماهنگی فعلی
- **Phoneme/Viseme support** برای توسعه آینده
- قابلیت اتصال به رندررهای 2D/Live2D/3D/VRM در آینده

### 6. Data Layer

#### فایل‌های شخصیت:
- `data/characters/harry.json`
- `data/characters/ron.json`
- `data/characters/hermione.json`

هر فایل می‌تواند شامل:
- Avatar configuration/assets
- Background configuration/assets
- Voice configuration
- AI configuration
- Personality traits

## Data Flow

```text
User Input
    ↓
Speech Recognition (با character language)
    ↓
Chat Message (گفت‌وگو و حافظه per-character)
    ↓
AI Response Generation
    ↓
Speech Output / TTS
    ↓
Voice Events → Lip-Sync Coordinator
    ↓
Avatar Animation
    ↓
Display with independently selected Background
```

## توسعه و جدایی

### Renderer Abstraction

رندرر کنونی می‌تواند با هر implementation سازگار جایگزین شود:

```typescript
// Current: AnimatedAvatarRenderer
// Future: SVGAvatarRenderer
// Future: CanvasAvatarRenderer
// Future: Live2DAvatarRenderer
// Future: VRM/ThreeDRenderer
```

### Voice Provider Abstraction

Voice input/output از Character rendering جدا نگه داشته شده و providerها می‌توانند بدون تغییر ChatUI تعویض شوند.

### Character Extensibility

اضافه کردن Character جدید باید فقط نیازمند:
1. فایل JSON جدید در `data/characters/`
2. تنظیمات Avatar و Background مستقل
3. تنظیمات Voice و AI
4. بدون تغییر در core Chat، AI، یا Avatar logic باشد

## اصول مهم

1. **هر Character مستقل است**: تغییر Harry نباید روی Ron یا Hermione اثر بگذارد.
2. **Avatar و Background مستقل‌اند**: هیچ preset اجباری بین آن‌ها وجود ندارد.
3. **ResponseManager مالک orchestration پاسخ است** و providerها نباید fallback boundary را دور بزنند.
4. **VoiceManager مالک orchestration صوت است** و شکست صوت نباید متن معتبر را حذف کند.
5. **Credentials فقط server-side هستند** و نباید وارد React یا localStorage شوند.
6. **معماری renderer-neutral است** و برای VRM/3D و Live2D آماده توسعه است.
7. **مدل‌های متنی به‌عنوان S2S معرفی نمی‌شوند**؛ Voice Chat فعلی text-response + TTS است.
8. **فارسی-اول**: مسیر فعلی Speech Recognition برای `fa-IR` تنظیم شده است.
