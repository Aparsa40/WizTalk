import fs from 'fs/promises';
import path from 'path';

const charactersDirectory = path.join(process.cwd(), 'data/characters');
const validId = /^[a-z0-9][a-z0-9_-]*$/;

export interface ServerCharacter {
  id: string; name: string; displayName: string; description: string; role: string;
  personality: { description: string; behavior: string; tone: string; communicationStyle: string };
  greeting: string; systemInstructions: string;
  avatar: { type: string; source: string; [key: string]: unknown };
  ai: { provider: 'local' | 'gemini' | 'openai'; model: string };
  voice: { provider: 'browser'; voiceId?: string; language: string; enabled: boolean };
  enabled: boolean; source?: 'builtin' | 'custom';
}

export function normalizeCharacter(raw: Record<string, any>, source: 'builtin' | 'custom' = 'builtin'): ServerCharacter {
  const personality = typeof raw.personality === 'string'
    ? { description: raw.personality, behavior: '', tone: '', communicationStyle: '' }
    : raw.personality || {};
  const avatar = typeof raw.avatar === 'string' ? { type: 'portrait', source: raw.avatar } : raw.avatar || { type: 'portrait', source: '' };
  return {
    ...raw,
    personality: {
      description: String(personality.description || ''), behavior: String(personality.behavior || ''),
      tone: String(personality.tone || ''), communicationStyle: String(personality.communicationStyle || ''),
    },
    avatar: { type: String(avatar.type || 'portrait'), source: String(avatar.source || ''), ...avatar },
    ai: { provider: raw.ai?.provider || 'local', model: raw.ai?.model || 'faq-keyword-v1' },
    voice: { provider: 'browser', language: raw.voice?.language || 'fa-IR', enabled: raw.voice?.enabled !== false, ...raw.voice },
    enabled: raw.enabled !== false,
    source: raw.source || source,
  } as ServerCharacter;
}

export async function listCharacters(): Promise<ServerCharacter[]> {
  const entries = await fs.readdir(charactersDirectory, { withFileTypes: true });
  const characters: ServerCharacter[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    try {
      const raw = JSON.parse(await fs.readFile(path.join(charactersDirectory, entry.name), 'utf8')) as Record<string, any>;
      if (!raw.id || !raw.name || !raw.systemInstructions) throw new Error('required fields missing');
      characters.push(normalizeCharacter(raw));
    } catch (error) { console.error('Skipping malformed character file ' + entry.name, error); }
  }
  return characters.filter((character) => character.enabled).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCharacter(id: string): Promise<ServerCharacter | null> {
  if (!validId.test(id)) return null;
  const character = (await listCharacters()).find((item) => item.id === id);
  return character || null;
}
