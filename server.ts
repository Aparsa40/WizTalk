import express from 'express';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { getCharacter, listCharacters } from './server/services/characters';
import { responseManager, type ResponseMode } from './server/services/response-manager';
import { getUserFromRequest, loginUser, logoutUser, registerUser } from './server/services/auth';
import { addChatMessage, createChatSession, deleteChatSession, getChatMessages, getChatSession, listChatSessions } from './server/services/chat-sessions';
import { addKnowledge, deleteKnowledge, listKnowledge } from './server/services/knowledge';

dotenv.config();

const app = express();
app.use(express.json({ limit: '256kb' }));
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

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

const staticRateLimiter = rateLimit({
  windowMs: 60000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

function requireUser(req: express.Request, res: express.Response) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'برای ادامه وارد حساب کاربری شوید.' });
    return null;
  }
  return user;
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'WizTalk' }));

app.get('/api/auth/status', (req, res) => {
  const user = getUserFromRequest(req);
  res.json({ authenticated: Boolean(user), user: user ? { id: user.id, username: user.username } : null });
});

app.post('/api/auth/register', authRateLimiter, (req, res) => {
  const { username, password } = req.body as { username?: unknown; password?: unknown };
  if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است.' });
  try {
    const user = registerUser(username, password, res);
    return res.status(201).json({ user });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const message = code === 'ACCOUNT_EXISTS'
      ? 'یک حساب قبلاً ساخته شده است. وارد شوید.'
      : code === 'INVALID_USERNAME'
        ? 'نام کاربری باید ۳ تا ۳۲ کاراکتر و فقط شامل حروف انگلیسی، عدد، _ یا - باشد.'
        : code === 'INVALID_PASSWORD'
          ? 'رمز عبور باید حداقل ۸ کاراکتر باشد.'
          : 'ساخت حساب ناموفق بود.';
    return res.status(code === 'ACCOUNT_EXISTS' ? 409 : 400).json({ error: message });
  }
});

app.post('/api/auth/login', authRateLimiter, (req, res) => {
  const { username, password } = req.body as { username?: unknown; password?: unknown };
  if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است.' });
  try {
    const user = loginUser(username, password, res);
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: 'نام کاربری یا رمز عبور صحیح نیست.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  logoutUser(req, res);
  res.json({ ok: true });
});

app.get('/api/models', (_req, res) => res.json({ providers: ['local', 'openrouter', 'huggingface'] }));

app.get('/api/characters', async (_req, res) => {
  try {
    res.json(await listCharacters());
  } catch (error) {
    console.error('Character list error', error);
    res.status(500).json({ error: 'بارگذاری شخصیت‌ها ناموفق بود.' });
  }
});

app.post('/api/sessions', async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const { characterId } = req.body as { characterId?: unknown };
  if (typeof characterId !== 'string') return res.status(400).json({ error: 'شخصیت انتخاب نشده است.' });

  const character = await getCharacter(characterId);
  if (!character) return res.status(404).json({ error: 'شخصیت پیدا نشد.' });

  const session = createChatSession(user.id, character.identity.id, character.identity.greeting);
  return res.status(201).json({ session, messages: getChatMessages(user.id, session.id) });
});

app.get('/api/sessions', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const characterId = typeof req.query.characterId === 'string' ? req.query.characterId : undefined;
  res.json(listChatSessions(user.id, characterId));
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const session = getChatSession(user.id, req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'جلسه پیدا نشد.' });
  return res.json({ session, messages: getChatMessages(user.id, session.id) });
});

app.delete('/api/sessions/:sessionId', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const deleted = deleteChatSession(user.id, req.params.sessionId);
  if (!deleted) return res.status(404).json({ error: 'جلسه پیدا نشد.' });
  return res.json({ ok: true });
});

app.get('/api/sessions/:sessionId/download', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const session = getChatSession(user.id, req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'جلسه پیدا نشد.' });
  const payload = JSON.stringify({ session, messages: getChatMessages(user.id, session.id) }, null, 2);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="wiztalk-${session.characterId}-${session.id}.json"`);
  return res.send(payload);
});

app.post('/api/chat', chatRateLimiter, async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const { message, sessionId, mode } = req.body as {
    message?: unknown;
    sessionId?: unknown;
    mode?: unknown;
  };

  if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'پیام نمی‌تواند خالی باشد.' });
  if (typeof sessionId !== 'string') return res.status(400).json({ error: 'جلسه چت انتخاب نشده است.' });

  const session = getChatSession(user.id, sessionId);
  if (!session) return res.status(404).json({ error: 'جلسه چت پیدا نشد.' });

  const character = await getCharacter(session.characterId);
  if (!character) return res.status(404).json({ error: 'شخصیت جلسه پیدا نشد.' });

  const safeMessage = message.trim();
  const previousMessages = getChatMessages(user.id, session.id);
  const history = previousMessages.map((item) => ({ sender: item.sender, text: item.text })).slice(-12);
  addChatMessage(session.id, 'user', safeMessage);

  const responseMode: ResponseMode = mode === 'voice' ? 'voice' : 'text';

  try {
    const result = await responseManager.generate({
      message: safeMessage,
      character,
      history,
      mode: responseMode,
    });
    const reply = addChatMessage(session.id, 'character', result.response);
    return res.json({ response: reply.text, message: reply, sessionId: session.id });
  } catch (error) {
    console.error('Response manager error', error);
    return res.status(502).json({ error: 'سرویس پاسخ‌گو در دسترس نیست. لطفاً دوباره تلاش کنید.' });
  }
});

app.post('/api/tts', ttsRateLimiter, async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const { text } = req.body as { text?: unknown };
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'متن صوتی نمی‌تواند خالی باشد.' });

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return res.status(503).json({ error: 'سرویس تبدیل متن به گفتار پیکربندی نشده است.' });

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OPENROUTER_TTS_MODEL, input: text.trim().slice(0, 15000), response_format: 'mp3' }),
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

  app.listen(PORT, '0.0.0.0', () => console.log(`WizTalk server listening on http://0.0.0.0:${PORT}`));
}

startServer().catch((error) => {
  console.error('Could not start WizTalk', error);
  process.exit(1);
});
