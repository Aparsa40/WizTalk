import { Character, Provider, normalizeCharacter } from '../types';

const CUSTOM_CHARACTERS_KEY = 'wiztalk_custom_characters';

function readCustomCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CHARACTERS_KEY);

    if (!raw) {
      return [];
    }

    const values = JSON.parse(raw) as unknown[];

    return values.map((value) =>
      normalizeCharacter(
        value as Record<string, unknown>,
        'custom',
      ),
    );
  } catch (error) {
    console.warn('Could not read custom characters', error);
    return [];
  }
}

function saveCustomCharacters(characters: Character[]): void {
  localStorage.setItem(
    CUSTOM_CHARACTERS_KEY,
    JSON.stringify(characters),
  );
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'character';
}

export function createCharacterDraft(
  overrides: Partial<Character> = {},
): Character {
  const draft = normalizeCharacter(
    {
      identity: {
        id: '',
        name: '',
        displayName: '',
        description: '',
        role: '',
        personality: {
          description: '',
          behavior: '',
          tone: '',
          communicationStyle: '',
        },
        greeting: 'سلام! خوشحالم که با هم صحبت می‌کنیم.',
        systemInstructions:
          'در نقش این شخصیت پاسخ بده و از شکستن نقش خودداری کن.',
      },

      avatar: {
        type: 'portrait',
        source: '',
      },

      knowledge: {
        faq: {
          source: 'shared',
        },
        raw: {
          content: '',
        },
        sources: {},
      },

      textModels: {
        default: {
          provider: 'local',
          model: 'faq-keyword-v1',
        },
      },

      voiceModels: {
        default: {
          provider: 'browser',
          language: 'fa-IR',
          enabled: true,
        },
      },

      settings: {
        enabled: true,
        source: 'custom',
      },
    },
    'custom',
  );

  return {
    ...draft,
    ...overrides,

    identity: {
      ...draft.identity,
      ...overrides.identity,
      personality: {
        ...draft.identity.personality,
        ...overrides.identity?.personality,
      },
    },

    avatar: {
      ...draft.avatar,
      ...overrides.avatar,
    },

    textModels: {
      ...draft.textModels,
      ...overrides.textModels,
    },

    voiceModels: {
      ...draft.voiceModels,
      ...overrides.voiceModels,
    },

    settings: {
      ...draft.settings,
      ...overrides.settings,
    },
  };
}

export class CharacterService {
  static async list(): Promise<Character[]> {
    const response = await fetch('/api/characters');

    if (!response.ok) {
      throw new Error('بارگذاری شخصیت‌ها ناموفق بود.');
    }

    const builtins = (await response.json()) as unknown[];

    return [
      ...builtins.map((item) =>
        normalizeCharacter(
          item as Record<string, unknown>,
        ),
      ),
      ...readCustomCharacters(),
    ];
  }


  static create(input: Character): Character {
    const existing = readCustomCharacters();

    const base = slugify(
      input.identity.name ||
        input.identity.displayName,
    );

    let id = base;
    let index = 2;

    while (
      existing.some(
        (item) => item.identity.id === id,
      )
    ) {
      id = `${base}-${index++}`;
    }

    const character: Character = {
      ...input,

      identity: {
        ...input.identity,
        id,
      },

      settings: {
        ...input.settings,
        source: 'custom',
        enabled: true,
      },
    };

    saveCustomCharacters([
      ...existing,
      character,
    ]);

    return character;
  }


  static update(input: Character): Character {
    const existing = readCustomCharacters();

    const index = existing.findIndex(
      (item) =>
        item.identity.id === input.identity.id,
    );

    if (index === -1) {
      throw new Error(
        'شخصیت سفارشی پیدا نشد.',
      );
    }

    const updated: Character = {
      ...input,

      settings: {
        ...input.settings,
        source: 'custom',
      },
    };

    existing[index] = updated;

    saveCustomCharacters(existing);

    return updated;
  }


  static remove(id: string): void {
    saveCustomCharacters(
      readCustomCharacters().filter(
        (item) =>
          item.identity.id !== id,
      ),
    );
  }


  static duplicate(input: Character): Character {
    return this.create({
      ...input,

      identity: {
        ...input.identity,

        id: '',

        name:
          input.identity.name + ' Copy',

        displayName:
          input.identity.displayName +
          ' (کپی)',
      },

      settings: {
        ...input.settings,
        source: 'custom',
      },
    });
  }


  static isCustom(character: Character): boolean {
    return (
      character.settings.source ===
      'custom'
    );
  }


  static defaultProvider(
    character: Character,
  ): Provider {
    return (
      character.textModels.default.provider ||
      'local'
    );
  }
}
