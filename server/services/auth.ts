import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { db, now } from './database';

const COOKIE_NAME = 'wiztalk_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function parseCookies(header: string | undefined): Record<string, string> {
  return Object.fromEntries(
    (header ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        return index === -1 ? [part, ''] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function setSessionCookie(res: Response, token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}${secure}`);
}

function clearSessionCookie(res: Response): void {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

function hashPassword(password: string, salt = randomBytes(16)): { hash: string; salt: string } {
  const derived = scryptSync(password, salt, 64);
  return { hash: derived.toString('base64'), salt: salt.toString('base64') };
}

function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  const candidate = Buffer.from(hashPassword(password, Buffer.from(storedSalt, 'base64')).hash, 'base64');
  const expected = Buffer.from(storedHash, 'base64');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export interface AuthUser { id: string; username: string; }

export function getUserFromRequest(req: Request): AuthUser | null {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return null;

  const row = db.prepare(`
    SELECT users.id, users.username
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashToken(token), now()) as { id: string; username: string } | undefined;

  return row ?? null;
}

export function registerUser(username: string, password: string, res: Response): AuthUser {
  const existing = db.prepare('SELECT id FROM users LIMIT 1').get() as { id: string } | undefined;
  if (existing) throw new Error('ACCOUNT_EXISTS');

  const cleanUsername = username.trim();
  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(cleanUsername)) throw new Error('INVALID_USERNAME');
  if (password.length < 8 || password.length > 128) throw new Error('INVALID_PASSWORD');

  const id = randomBytes(16).toString('hex');
  const { hash, salt } = hashPassword(password);
  db.prepare('INSERT INTO users (id, username, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, cleanUsername, hash, salt, now());

  createSession(id, res);
  return { id, username: cleanUsername };
}

export function loginUser(username: string, password: string, res: Response): AuthUser {
  const row = db.prepare('SELECT id, username, password_hash, password_salt FROM users WHERE username = ?').get(username.trim()) as
    | { id: string; username: string; password_hash: string; password_salt: string }
    | undefined;

  if (!row || !verifyPassword(password, row.password_hash, row.password_salt)) throw new Error('INVALID_CREDENTIALS');

  createSession(row.id, res);
  return { id: row.id, username: row.username };
}

function createSession(userId: string, res: Response): void {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = now() + SESSION_TTL_MS;
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now());
  db.prepare('INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(randomBytes(16).toString('hex'), userId, hashToken(token), expiresAt, now());
  setSessionCookie(res, token);
}

export function logoutUser(req: Request, res: Response): void {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  clearSessionCookie(res);
}
