import express from 'express';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  getCharacter,
  listCharacterPresentations,
  ServerCharacter,
} from './server/services/characters';
import { generateResponse } from './server/services/ai';

dotenv.config();

const app = express();

app.use(express.json({ limit: '64kb' }));

const PORT = 3000;

const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
  },
});

const staticRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'تعداد درخواست‌ها برای بارگذاری صفحه بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
  },
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'WizTalk',
  });
});

app.get('/api/characters', async (_req, res) => {
  try {
    res.json(await listCharacterPresentations());
  } catch (error) {
    console.error('Character list error', error);
    res.status(500).json({
      error: 'بارگذاری شخصیت‌ها ناموفق بود.',
    });
  }
});

// Kept as an explicit retirement response so SPA fallback never makes this
// former provider-selection endpoint appear usable.
app.get('/api/models', (_req, res) => {
  res.status(410).json({
    error: 'انتخاب مدل در مرورگر پشتیبانی نمی‌شود.',
  });
});

app.post('/api/chat', chatRateLimiter, async (req, res) => {
  const {
    message,
    characterId,
    history,
  } = req.body as {
    message?: unknown;
    characterId?: unknown;
    history?: unknown;
  };

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'پیام نمی‌تواند خالی باشد.',
    });
  }

  if (typeof characterId !== 'string' || !characterId.trim()) {
    return res.status(400).json({
      error: 'شخصیت انتخاب نشده است.',
    });
  }

  const character: ServerCharacter | null = await getCharacter(characterId);

  if (!character) {
    return res.status(404).json({
      error: 'شخصیت پیدا نشد.',
    });
  }

  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (
            item
          ): item is {
            sender: 'user' | 'character';
            text: string;
          } =>
            Boolean(
              item &&
                (item.sender === 'user' ||
                  item.sender === 'character') &&
                typeof item.text === 'string'
            )
        )
        .slice(-12)
    : [];

  try {
    const result = await generateResponse({
      message: message.trim(),
      character,
      history: safeHistory,
    });

    res.json({
      response: result.response,
      characterId: character.id,
    });
  } catch (error) {
    console.error('Chat generation error', error);

    res.status(500).json({
      error: 'پاسخ‌گویی به گفت‌وگو در حال حاضر با مشکل مواجه شد.',
    });
  }
});

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath =
      path.join(process.cwd(), 'dist');

    app.use(express.static(distPath));

    app.get('*', staticRateLimiter, (_req, res) =>
      res.sendFile(
        path.join(distPath, 'index.html')
      )
    );
  }

  app.listen(
    PORT,
    '0.0.0.0',
    () =>
      console.log(
        `WizTalk server listening on http://0.0.0.0:${PORT}`
      )
  );
}

startServer().catch((error) => {
  console.error(
    'Could not start WizTalk',
    error
  );

  process.exit(1);
});
