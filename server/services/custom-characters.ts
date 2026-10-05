import { db, now } from './database';
import type { Character } from '../../src/types';

export function listCustomCharacters(userId: string): Character[] {
  const rows = db.prepare(
    'SELECT data_json FROM custom_characters WHERE user_id = ? ORDER BY updated_at DESC',
  ).all(userId) as Array<{ data_json: string }>;

  return rows.flatMap((row) => {
    try {
      return [JSON.parse(row.data_json) as Character];
    } catch {
      return [];
    }
  });
}

export function getCustomCharacter(userId: string, characterId: string): Character | null {
  const row = db.prepare(
    'SELECT data_json FROM custom_characters WHERE user_id = ? AND id = ?',
  ).get(userId, characterId) as { data_json: string } | undefined;

  if (!row) return null;

  try {
    return JSON.parse(row.data_json) as Character;
  } catch {
    return null;
  }
}

export function saveCustomCharacter(userId: string, character: Character): Character {
  const id = character.identity.id.trim();
  if (!id) throw new Error('INVALID_CHARACTER_ID');

  const timestamp = now();
  db.prepare(
    `INSERT INTO custom_characters (id, user_id, data_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, id) DO UPDATE SET
       data_json = excluded.data_json,
       updated_at = excluded.updated_at`,
  ).run(id, userId, JSON.stringify(character), timestamp, timestamp);

  return character;
}

export function deleteCustomCharacter(userId: string, characterId: string): boolean {
  const result = db.prepare(
    'DELETE FROM custom_characters WHERE user_id = ? AND id = ?',
  ).run(userId, characterId);

  return Number(result.changes) > 0;
}
