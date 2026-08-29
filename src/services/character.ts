import { Character, Provider } from '../types';

const CUSTOM_CHARACTERS_KEY = 'wiztalk_custom_characters';

function readCustomCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CHARACTERS_KEY);
    return raw ? JSON.parse(raw) as Character[] : [];
  } catch (error) {
    console.warn('Could not read custom characters', error);
    return [];
  }
}

function saveCustomCharacters(characters: Character[]): void {
  localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify(characters));
}

function slugify(value: string): string {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'character';
}

export function createCharacterDraft(overrides: Partial<Character> = {}): Character {
  return {
    id: '', name: '', displayName: '', description: '', role: '',
    personality: { description: '', behavior: '', tone: '', communicationStyle: '' },
    greeting: 'سلام! خوشحالم که با هم صحبت می‌کنیم.',
    systemInstructions: 'در نقش این شخصیت پاسخ بده و از شکستن نقش خودداری کن.',
    avatar: { type: 'portrait', source: '' },
    ai: { provider: 'local', model: 'faq-keyword-v1' },
    voice: { provider: 'browser', language: 'fa-IR', enabled: true },
    enabled: true, source: 'custom', ...overrides,
  };
}

export class CharacterService {
  static async list(): Promise<Character[]> {
    const response = await fetch('/api/characters');
    if (!response.ok) throw new Error('بارگذاری شخصیت‌ها ناموفق بود.');
    const builtins = await response.json() as Character[];
    return [...builtins, ...readCustomCharacters()];
  }

  static create(input: Character): Character {
    const base = slugify(input.name || input.displayName);
    const existing = readCustomCharacters();
    let id = base;
    let index = 2;
    while (existing.some((item) => item.id === id)) id = base + '-' + index++;
    const character = { ...input, id, source: 'custom' as const, enabled: true };
    saveCustomCharacters([...existing, character]);
    return character;
  }

  static update(input: Character): Character {
    const existing = readCustomCharacters();
    const index = existing.findIndex((item) => item.id === input.id);
    if (index === -1) throw new Error('شخصیت سفارشی پیدا نشد.');
    const updated = { ...input, source: 'custom' as const };
    existing[index] = updated;
    saveCustomCharacters(existing);
    return updated;
  }

  static remove(id: string): void {
    saveCustomCharacters(readCustomCharacters().filter((item) => item.id !== id));
  }

  static duplicate(input: Character): Character {
    return this.create({ ...input, id: '', name: input.name + ' Copy', displayName: input.displayName + ' (کپی)', source: 'custom' });
  }

  static isCustom(character: Character): boolean { return character.source === 'custom'; }
  static defaultProvider(character: Character): Provider { return character.ai?.provider || 'local'; }
}
