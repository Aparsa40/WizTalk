import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Load character data
async function getCharacter(id: string) {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data/characters', `${id}.json`), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading character ${id}:`, error);
    return null;
  }
}

// Load FAQ data
async function getFAQs() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data/faq/faqs.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading FAQs:', error);
    return [];
  }
}

// API Routes
app.post('/api/chat', async (req, res) => {
  const { message, characterId, provider, model, openAiKey } = req.body;

  if (!message || !characterId || !provider) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const character = await getCharacter(characterId);
  if (!character) {
    return res.status(404).json({ error: 'Character not found' });
  }

  try {
    let responseText = '';

    if (provider === 'local') {
      const faqs = await getFAQs();
      const match = faqs.find((faq: any) => 
        faq.keywords.some((kw: string) => message.toLowerCase().includes(kw.toLowerCase()))
      );
      responseText = match ? match.response : "متاسفم، دقیقاً متوجه نشدم چی گفتی. میشه یه جور دیگه بگی؟";
    } 
    else if (provider === 'gemini') {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await genAI.models.generateContent({
        model: model || 'gemini-2.5-flash',
        contents: message,
        config: {
          systemInstruction: character.systemInstructions,
          temperature: 0.7,
        }
      });
      responseText = response.text || '';
    } 
    else if (provider === 'openai') {
      if (!openAiKey) {
        return res.status(400).json({ error: 'OpenAI API key is required for this provider' });
      }
      const openai = new OpenAI({ apiKey: openAiKey });
      const completion = await openai.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: character.systemInstructions },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      });
      responseText = completion.choices[0]?.message?.content || '';
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    res.json({ response: responseText });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Characters endpoint
app.get('/api/characters', async (req, res) => {
  try {
    const files = await fs.readdir(path.join(process.cwd(), 'data/characters'));
    const characters = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(process.cwd(), 'data/characters', file), 'utf-8');
        characters.push(JSON.parse(data));
      }
    }
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load characters' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
