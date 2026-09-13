import express from 'express';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { getCharacter, listCharacters } from './server/services/characters';
import { responseManager, type ResponseMode } from './server/services/response-manager';

dotenv.config();

const app = express();
app.use(express.json({ limit: '64kb' }));
const PORT = Number(process.env.PORT) || 3000;
const OPENROUTER_TTS_MODEL = 'fish-audio/s2.1-pro-free:free';

const chatRateLimiter = rateLimit({
  windowMs: 60000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.' },
});

const ttsRateLimiter = rateLimit({
  windowMs: 60000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'تعداد درخواست‌های صوتی بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.' },
});

const staticRateLimiter = rateLimit({
  windowMs: 60000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'WizTalk' }));

app.get('/api/characters', async (_req, res) => {
  try {
    res.json(await listCharacters());
  } catch (error) {
    console.error('Character list error', error);
    res.status(500).json({ error: 'بارگذاری شخصیت‌ها ناموفق بود.' });
  }
});

app.post('/api/chat', chatRateLimiter, async (req, res) => {
  const { message, characterId, history, mode } = req.body as {
    message?: unknown;
    characterId?: unknown;
    history?: unknown;
    mode?: unknown;
  };

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'پیام نمی‌تواند خالی باشد.' });
  }
  if (typeof characterId !== 'string') {
    return res.status(400).json({ error: 'شخصیت انتخاب نشده است.' });
  }

  const responseMode: ResponseMode = mode === 'voice' ? 'voice' : 'text';
  const character = await getCharacter(characterId);
  if (!character) return res.status(404).json({ error: 'شخصیت پیدا نشد.' });

  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (item): item is { sender: 'user' | 'character'; text: string } =>
            Boolean(
              item &&
                (item.sender === 'user' || item.sender === 'character') &&
                typeof item.text === 'string'
            )
        )
        .slice(-12)
    : [];

  try {
    const result = await responseManager.generate({
      message: message.trim(),
      character,
      history: safeHistory,
      mode: responseMode,
    });

    // Provider/model metadata and raw failures remain server-side.
    res.json({ response: result.response });
  } catch (error) {
    console.error('Response manager error', error);
    res.status(502).json({ error: 'سرویس پاسخ‌گو در دسترس نیست. لطفاً دوباره تلاش کنید.' });
  }
});

app.post('/api/tts', ttsRateLimiter, async (req, res) => {
  const { text } = req.body as { text?: unknown };

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'متن صوتی نمی‌تواند خالی باشد.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return res.status(503).json({ error: 'سرویس تبدیل متن به گفتار پیکربندی نشده است.' });
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_TTS_MODEL,
        input: text.trim().slice(0, 15000),
        response_format: 'mp3',
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error('OpenRouter TTS error', upstream.status, detail.slice(0, 500));
      return res.status(502).json({ error: 'تولید صدای پاسخ ناموفق بود.' });
    }

    const audio = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(audio);
  } catch (error) {
    console.error('TTS request error', error);
    return res.status(502).json({ error: 'ارتباط با سرویس صوتی ناموفق بود.' });
  }
});

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', staticRateLimiter, (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () =>
    console.log(`WizTalk server listening on http://0.0.0.0:${PORT}`)
  );
}

startServer().catch((error) => {
  console.error('Could not start WizTalk', error);
  process.exit(1);
});
