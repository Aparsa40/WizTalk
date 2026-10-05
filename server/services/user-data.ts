import { db, now } from './database';

export interface UserProfile {
  name: string;
  preferredAddress: string;
  interests: string[];
  notes: string;
}

const emptyProfile: UserProfile = {
  name: '',
  preferredAddress: '',
  interests: [],
  notes: '',
};

export function getUserProfile(userId: string): UserProfile {
  const row = db.prepare(
    'SELECT name, preferred_address, interests_json, notes FROM user_profiles WHERE user_id = ?',
  ).get(userId) as {
    name: string;
    preferred_address: string;
    interests_json: string;
    notes: string;
  } | undefined;

  if (!row) return emptyProfile;

  let interests: string[] = [];
  try {
    const parsed = JSON.parse(row.interests_json);
    if (Array.isArray(parsed)) interests = parsed.filter((item): item is string => typeof item === 'string').slice(0, 100);
  } catch {
    interests = [];
  }

  return {
    name: row.name,
    preferredAddress: row.preferred_address,
    interests,
    notes: row.notes,
  };
}

export function saveUserProfile(userId: string, profile: UserProfile): UserProfile {
  const clean: UserProfile = {
    name: profile.name.trim().slice(0, 120),
    preferredAddress: profile.preferredAddress.trim().slice(0, 120),
    interests: profile.interests.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 100),
    notes: profile.notes.trim().slice(0, 10000),
  };
  const timestamp = now();

  db.prepare(
    `INSERT INTO user_profiles (user_id, name, preferred_address, interests_json, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       name = excluded.name,
       preferred_address = excluded.preferred_address,
       interests_json = excluded.interests_json,
       notes = excluded.notes,
       updated_at = excluded.updated_at`,
  ).run(
    userId,
    clean.name,
    clean.preferredAddress,
    JSON.stringify(clean.interests),
    clean.notes,
    timestamp,
    timestamp,
  );

  return clean;
}

export function getUserPreferences(userId: string) {
  const row = db.prepare(
    'SELECT selected_character_id, voice_enabled FROM user_preferences WHERE user_id = ?',
  ).get(userId) as { selected_character_id: string | null; voice_enabled: number } | undefined;

  return {
    selectedCharacterId: row?.selected_character_id ?? null,
    voiceEnabled: row ? row.voice_enabled !== 0 : true,
  };
}

export function saveUserPreferences(
  userId: string,
  preferences: { selectedCharacterId: string | null; voiceEnabled: boolean },
) {
  const timestamp = now();

  db.prepare(
    `INSERT INTO user_preferences (user_id, selected_character_id, voice_enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       selected_character_id = excluded.selected_character_id,
       voice_enabled = excluded.voice_enabled,
       updated_at = excluded.updated_at`,
  ).run(
    userId,
    preferences.selectedCharacterId,
    preferences.voiceEnabled ? 1 : 0,
    timestamp,
    timestamp,
  );

  return preferences;
}
