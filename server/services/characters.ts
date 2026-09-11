import fs from 'fs/promises';
import path from 'path';

const charactersDirectory = path.join(process.cwd(), 'data/characters');
const validId = /^[a-z0-9][a-z0-9_-]*$/;

/** Data that may be returned to the browser for rendering a character. */
export interface CharacterPresentation {
  id: string; name: string; displayName: string; description: string; role: string;
  personality: { description: string; behavior: string; tone: string; communicationStyle: string };
  greeting: string;
  avatar: { type: string; source: string; [key: string]: unknown };
  voice: { provider: 'browser'; voiceId?: string; language: string; enabled: boolean };
  enabled: boolean; source?: 'builtin' | 'custom';
}

/** Server-only data used by the character and AI runtimes. */
export interface ServerCharacter extends CharacterPresentation {
  systemInstructions: string;
  ai: { provider: 'openrouter' | 'local' | 'gemini' | 'openai' | string; model?: string };
}

export function normalizeCharacter(raw: Record<string, any>, source: 'builtin' = 'builtin'): ServerCharacter {
  const personality = typeof raw.personality === 'string'
    ? { description: raw.personality, behavior: '', tone: '', communicationStyle: '' }
    : raw.personality || {};
  const avatar = typeof raw.avatar === 'string' ? { type: 'portrait', source: raw.avatar } : raw.avatar || { type: 'portrait', source: '' };
  return {
    id: String(raw.id || ''),
    name: String(raw.name || ''),
    displayName: String(raw.displayName || raw.name || ''),
    description: String(raw.description || ''),
    role: String(raw.role || ''),
    personality: {
      description: String(personality.description || ''), behavior: String(personality.behavior || ''),
      tone: String(personality.tone || ''), communicationStyle: String(personality.communicationStyle || ''),
    },
    avatar: { type: String(avatar.type || 'portrait'), source: String(avatar.source || ''), ...avatar },
    greeting: String(raw.greeting || ''),
    systemInstructions: String(raw.systemInstructions || ''),
    ai: { provider: raw.ai?.provider || 'openrouter', model: raw.ai?.model || 'minimax/minimax-m2.7:free' },
    voice: { provider: 'browser', language: raw.voice?.language || 'fa-IR', enabled: raw.voice?.enabled !== false, ...raw.voice },
    enabled: raw.enabled !== false,
    source: raw.source || source,
  } as ServerCharacter;
}

/** Explicit allow-list prevents AI/runtime fields from crossing the API boundary. */
export function toCharacterPresentation(character: ServerCharacter): CharacterPresentation {
  return {
    id: character.id,
    name: character.name,
    displayName: character.displayName,
    description: character.description,
    role: character.role,
    personality: character.personality,
    greeting: character.greeting,
    avatar: character.avatar,
    voice: character.voice,
    enabled: character.enabled,
    source: character.source,
  };
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

export async function listCharacterPresentations(): Promise<CharacterPresentation[]> {
  return (await listCharacters()).map(toCharacterPresentation);
}
