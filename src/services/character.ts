import { ApiService } from './api';
import { Character, Provider, normalizeCharacter } from '../types';

type CharacterUserSettings = Pick<Character, 'identity' | 'avatar' | 'backgrounds' | 'voiceModels'>;

function applyUserSettings(character: Character, override: Partial<CharacterUserSettings>): Character {
  const selectedAvatarId = override.avatar?.selectedId;
  const selectedAvatar = character.avatar.assets?.find((asset) => asset.id === selectedAvatarId);
  const validSelectedAvatarId = selectedAvatar?.id ?? character.avatar.selectedId ?? character.avatar.assets?.[0]?.id;

  return {
    ...character,
    identity: { ...character.identity, ...(override.identity ?? {}) },
    avatar: {
      ...character.avatar,
      selectedId: validSelectedAvatarId,
      ...(selectedAvatar ? {
        type: selectedAvatar.type,
        source: selectedAvatar.source,
        thumbnail: selectedAvatar.thumbnail,
        fallbackSource: selectedAvatar.fallbackSource,
        animationSpeed: selectedAvatar.animationSpeed,
        customAnimationData: selectedAvatar.customAnimationData,
      } : {}),
    },
    backgrounds: {
      ...character.backgrounds,
      selectedId: override.backgrounds?.selectedId ?? character.backgrounds.selectedId,
    },
    voiceModels: {
      ...character.voiceModels,
      ...(override.voiceModels ?? {}),
      output: {
        ...character.voiceModels.output,
        ...(override.voiceModels?.output ?? {}),
      },
    },
  };
}

function extractUserSettings(character: Character): CharacterUserSettings {
  return {
    identity: character.identity,
    avatar: character.avatar,
    backgrounds: character.backgrounds,
    voiceModels: character.voiceModels,
  };
}

function slugify(value: string): string {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'character';
}

export function createCharacterDraft(overrides: Partial<Character> = {}): Character {
  const draft = normalizeCharacter({
    identity: {
      id: '', name: '', displayName: '', description: '', role: '',
      personality: { description: '', behavior: '', tone: '', communicationStyle: '' },
      greeting: 'سلام! خوشحالم که با هم صحبت می‌کنیم.',
      systemInstructions: 'در نقش این شخصیت پاسخ بده و از شکستن نقش خودداری کن.',
    },
    avatar: { type: 'portrait', source: '' },
    backgrounds: { selectedId: '', assets: [] },
    knowledge: { faq: { source: 'shared' }, raw: { content: '' }, sources: {} },
    textModels: { default: { provider: 'local', model: 'faq-keyword-v1' } },
    voiceModels: { default: { provider: 'browser', language: 'fa-IR', enabled: true } },
    settings: { enabled: true, source: 'custom' },
  }, 'custom');

  return {
    ...draft,
    ...overrides,
    identity: { ...draft.identity, ...overrides.identity, personality: { ...draft.identity.personality, ...overrides.identity?.personality } },
    avatar: { ...draft.avatar, ...overrides.avatar },
    backgrounds: { ...draft.backgrounds, ...overrides.backgrounds },
    textModels: { ...draft.textModels, ...overrides.textModels },
    voiceModels: { ...draft.voiceModels, ...overrides.voiceModels, output: { ...draft.voiceModels.output, ...overrides.voiceModels?.output } },
    settings: { ...draft.settings, ...overrides.settings },
  };
}

export class CharacterService {
  static async list(): Promise<Character[]> {
    const characters = await ApiService.getCharacters();
    const result: Character[] = [];

    for (const raw of characters) {
      const normalized = normalizeCharacter(raw);
      try {
        const settings = await ApiService.getCharacterSettings(normalized.identity.id);
        result.push(applyUserSettings(normalized, settings));
      } catch {
        result.push(normalized);
      }
    }

    return result;
  }

  static async create(input: Character): Promise<Character> {
    const existing = await this.list();
    const base = slugify(input.identity.name || input.identity.displayName);
    let id = base;
    let index = 2;
    while (existing.some((item) => item.identity.id === id)) id = `${base}-${index++}`;

    const character: Character = {
      ...input,
      identity: { ...input.identity, id },
      settings: { ...input.settings, source: 'custom', enabled: true },
    };

    return ApiService.saveCustomCharacter(character);
  }

  static async update(input: Character): Promise<Character> {
    if (!this.isCustom(input)) throw new Error('شخصیت اصلی فقط خواندنی است.');
    return ApiService.saveCustomCharacter({
      ...input,
      settings: { ...input.settings, source: 'custom' },
    });
  }

  static async saveUserSettings(input: Character): Promise<Character> {
    const settings = extractUserSettings(input);
    await ApiService.saveCharacterSettings(input.identity.id, settings);
    return input;
  }

  static async remove(id: string): Promise<void> {
    await ApiService.deleteCustomCharacter(id);
  }

  static async duplicate(input: Character): Promise<Character> {
    return this.create({
      ...input,
      identity: {
        ...input.identity,
        id: '',
        name: input.identity.name + ' Copy',
        displayName: input.identity.displayName + ' (کپی)',
      },
      settings: { ...input.settings, source: 'custom' },
    });
  }

  static isCustom(character: Character): boolean {
    return character.settings.source === 'custom';
  }

  static defaultProvider(character: Character): Provider {
    return character.textModels.default.provider || 'local';
  }
}
