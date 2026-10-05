import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../database/migration-runner';

const dataDirectory = path.join(process.cwd(), 'data');
mkdirSync(dataDirectory, { recursive: true });

const databasePath =
  process.env.WIZTALK_DB_PATH?.trim() || path.join(dataDirectory, 'wiztalk.sqlite');

export const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);

runMigrations(db);

export function now(): number {
  return Date.now();
}
