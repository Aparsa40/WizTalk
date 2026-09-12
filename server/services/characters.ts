import fs from 'fs/promises';
import path from 'path';
import {
  Character,
  normalizeCharacter as normalize,
  type LegacyCharacter,
} from '../../src/types';

const charactersDirectory = path.join(
  process.cwd(),
  'data/characters'
);
const validId = /^[a-z0-9][a-z0-9_-]*$/;

export type ServerCharacter = Character;

export function normalizeCharacter(
  raw: Record<string, unknown>,
  source: 'builtin' | 'custom' = 'builtin'
): ServerCharacter {
  return normalize(
    raw as unknown as LegacyCharacter,
    source
  );
}

export async function listCharacters(): Promise<
  ServerCharacter[]
> {
  const entries = await fs.readdir(
    charactersDirectory,
    { withFileTypes: true }
  );

  const characters: ServerCharacter[] = [];

  for (const entry of entries) {
    if (
      !entry.isFile() ||
      !entry.name.endsWith('.json')
    ) {
      continue;
    }

    try {
      const character = normalizeCharacter(
        JSON.parse(
          await fs.readFile(
            path.join(
              charactersDirectory,
              entry.name
            ),
            'utf8'
          )
        ) as Record<string, unknown>
      );

      if (
        !character.identity.id ||
        !character.identity.name ||
        !character.identity.systemInstructions
      ) {
        throw new Error(
          'required identity fields missing'
        );
      }

      characters.push(character);
    } catch (error) {
      console.error(
        'Skipping malformed character file ' +
          entry.name,
        error
      );
    }
  }

  return characters
    .filter(
      (character) =>
        character.settings.enabled
    )
    .sort((a, b) =>
      a.identity.name.localeCompare(
        b.identity.name
      )
    );
}

export async function getCharacter(
  id: string
): Promise<ServerCharacter | null> {
  if (!validId.test(id)) {
    return null;
  }

  return (
    (await listCharacters()).find(
      (item) => item.identity.id === id
    ) || null
  );
}
