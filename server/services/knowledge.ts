import { randomBytes } from 'node:crypto';
import { db, now } from './database';

export interface KnowledgeDocument {
  id: string;
  characterId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface KnowledgeRow {
  id: string;
  character_id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
}

function mapRow(row: KnowledgeRow): KnowledgeDocument {
  return {
    id: row.id,
    characterId: row.character_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listKnowledge(userId: string, characterId: string): KnowledgeDocument[] {
  const rows = db.prepare(
    'SELECT id, character_id, title, content, created_at, updated_at FROM knowledge_documents WHERE user_id = ? AND character_id = ? ORDER BY updated_at DESC',
  ).all(userId, characterId) as unknown as KnowledgeRow[];

  return rows.map(mapRow);
}

export function addKnowledge(
  userId: string,
  characterId: string,
  title: string,
  content: string,
): KnowledgeDocument {
  const cleanTitle = title.trim().slice(0, 160) || 'دانش بدون عنوان';
  const cleanContent = content.trim().slice(0, 200000);
  if (!cleanContent) throw new Error('EMPTY_KNOWLEDGE');

  const timestamp = now();
  const document = {
    id: randomBytes(16).toString('hex'),
    characterId,
    title: cleanTitle,
    content: cleanContent,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.prepare(
    'INSERT INTO knowledge_documents (id, user_id, character_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    document.id,
    userId,
    characterId,
    document.title,
    document.content,
    timestamp,
    timestamp,
  );

  return document;
}

export function deleteKnowledge(userId: string, id: string, characterId: string): boolean {
  const result = db.prepare(
    'DELETE FROM knowledge_documents WHERE id = ? AND user_id = ? AND character_id = ?',
  ).run(id, userId, characterId);

  return Number(result.changes) > 0;
}

export function searchKnowledge(userId: string, characterId: string, message: string): string {
  const normalized = message.toLocaleLowerCase('fa-IR').trim();
  if (!normalized) return '';

  const tokens = normalized.split(/\s+/).filter((token) => token.length >= 2);
  if (!tokens.length) return '';

  const documents = listKnowledge(userId, characterId);
  let best = { score: 0, content: '' };

  for (const document of documents) {
    const haystack = (document.title + '\n' + document.content).toLocaleLowerCase('fa-IR');
    const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
    if (score > best.score) best = { score, content: document.content };
  }

  return best.score >= Math.min(2, tokens.length) ? best.content.slice(0, 3000) : '';
}
