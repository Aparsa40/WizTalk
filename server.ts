import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { getCharacter, listCharacters } from './server/services/characters';
import { generateResponse, providerConfigs, Provider } from './server/services/ai';

dotenv.config();
const app = express();
app.use(express.json({ limit: '64kb' }));
const PORT = Number(process.env.PORT) || 3000;
const providers = new Set<Provider>(['local', 'gemini', 'openai']);

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'wiztalk' }));

app.get('/api/characters', async (_req, res) => {
  try { res.json(await listCharacters()); }
  catch (error) { console.error('Character list error', error); res.status(500).json({ error: 'بارگذاری شخصیت‌ها ناموفق بود.' }); }
});

app.get('/api/models', (_req, res) => res.json(providerConfigs));

app.post('/api/chat', async (req, res) => {
  const { message, characterId, provider, model, history } = req.body as { message?: unknown; characterId?: unknown; provider?: unknown; model?: unknown; history?: unknown };
  if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'پیام نمی‌تواند خالی باشد.' });
  if (typeof characterId !== 'string') return res.status(400).json({ error: 'شخصیت انتخاب نشده است.' });
  if (typeof provider !== 'string' || !providers.has(provider as Provider)) return res.status(400).json({ error: 'ارائه‌دهنده‌ی هوش مصنوعی نامعتبر است.' });
  const character = await getCharacter(characterId);
  if (!character) return res.status(404).json({ error: 'شخصیت پیدا نشد.' });
  const safeHistory = Array.isArray(history) ? history.filter((item): item is { sender: 'user' | 'character'; text: string } => Boolean(item && (item.sender === 'user' || item.sender === 'character') && typeof item.text === 'string')).slice(-12) : [];
  try {
    const result = await generateResponse({ message: message.trim(), character, provider: provider as Provider, model: typeof model === 'string' ? model : undefined, history: safeHistory });
    res.json(result);
  } catch (error) {
    console.error('Chat provider error', error);
    res.status(502).json({ error: error instanceof Error ? error.message : 'ارتباط با سرویس هوش مصنوعی ناموفق بود.' });
  }
});

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log('WizTalk server listening on http://0.0.0.0:' + PORT));
}

startServer().catch((error) => { console.error('Could not start WizTalk', error); process.exit(1); });
