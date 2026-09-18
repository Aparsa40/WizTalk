import { randomBytes } from 'node:crypto';
import { db, now } from './database';

export interface ChatMessageRow {
  id: string;
  sender: 'user' | 'character';
  text: string;
  timestamp: number;
}

export interface ChatSessionRow {
  id: string;
  characterId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export function createChatSession(userId: string, characterId: string, greeting: string): ChatSessionRow {
  const id = randomBytes(16).toString('hex');
  const timestamp = now();
  db.prepare('INSERT INTO chat_sessions (id, user_id, character_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, userId, characterId, 'گفت‌وگوی جدید', timestamp, timestamp);
  addChatMessage(id, 'character', greeting);
  return { id, characterId, title: 'گفت‌وگوی جدید', createdAt: timestamp, updatedAt: timestamp };
}

export function getChatSession(userId: string, sessionId: string): ChatSessionRow | null {
  const row = db.prepare('SELECT id, character_id, title, created_at, updated_at FROM chat_sessions WHERE id = ? AND user_id = ?')
    .get(sessionId, userId) as { id: string; character_id: string; title: string; created_at: number; updated_at: number } | undefined;
  return row ? { id: row.id, characterId: row.character_id, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at } : null;
}

export function listChatSessions(userId: string, characterId?: string): ChatSessionRow[] {
  const rows = characterId
    ? db.prepare('SELECT id, character_id, title, created_at, updated_at FROM chat_sessions WHERE user_id = ? AND character_id = ? ORDER BY updated_at DESC').all(userId, characterId)
    : db.prepare('SELECT id, character_id, title, created_at, updated_at FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
  return (rows as Array<{ id: string; character_id: string; title: string; created_at: number; updated_at: number }>).map((row) => ({
    id: row.id, characterId: row.character_id, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at,
  }));
}

export function addChatMessage(sessionId: string, sender: 'user' | 'character', text: string): ChatMessageRow {
  const message = { id: randomBytes(16).toString('hex'), sender, text, timestamp: now() };
  db.prepare('INSERT INTO chat_messages (id, chat_session_id, sender, text, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(message.id, sessionId, sender, text, message.timestamp);
  db.prepare('UPDATE chat_sessions SET updated_at = ?, title = CASE WHEN ? = \'user\' AND title = \'گفت‌وگوی جدید\' THEN substr(?, 1, 60) ELSE title END WHERE id = ?')
    .run(message.timestamp, sender, text, sessionId);
  return message;
}

export function getChatMessages(userId: string, sessionId: string): ChatMessageRow[] {
  const session = getChatSession(userId, sessionId);
  if (!session) return [];
  const rows = db.prepare('SELECT id, sender, text, created_at FROM chat_messages WHERE chat_session_id = ? ORDER BY created_at ASC').all(sessionId);
  return (rows as Array<{ id: string; sender: 'user' | 'character'; text: string; created_at: number }>).map((row) => ({
    id: row.id, sender: row.sender, text: row.text, timestamp: row.created_at,
  }));
}

export function deleteChatSession(userId: string, sessionId: string): boolean {
  const result = db.prepare('DELETE FROM chat_sessions WHERE id = ? AND user_id = ?').run(sessionId, userId);
  return Number(result.changes) > 0;
}
