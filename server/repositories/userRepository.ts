import { db } from '../db/index.js';
import type { User } from '../types.js';

interface UserRow {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
}

interface SessionUserRow extends UserRow {
  expires_at: string;
}

function toUser(row: UserRow): User {
  return { id: row.id, fullName: row.full_name, email: row.email };
}

export function findUserByEmail(email: string) {
  return db.prepare('SELECT id, full_name, email, password_hash FROM users WHERE email = ?').get(email) as UserRow | undefined;
}

export function createUser(fullName: string, email: string, passwordHash: string) {
  const result = db.prepare('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)').run(fullName, email, passwordHash);
  return { id: Number(result.lastInsertRowid), fullName, email };
}

export function createSession(userId: number, token: string, expiresAt: string) {
  db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(userId, token, expiresAt);
}

export function findUserBySession(token: string): User | undefined {
  const row = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.password_hash, s.expires_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
  `).get(token) as SessionUserRow | undefined;
  if (!row) return undefined;
  if (row.expires_at <= new Date().toISOString()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return undefined;
  }
  return toUser(row);
}

export function removeSession(token: string) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}
