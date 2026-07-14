import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import db from '../../db/client.js';

export const COOKIE_NAME = 'sid';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function verifyCredentials(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return null;
  return bcrypt.compareSync(password, user.password_hash) ? user : null;
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return { token, expiresAt };
}

export function findSessionWithUser(token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT s.token, s.expires_at, u.id as user_id, u.username, u.role, u.restaurant_id, u.nav_visibility, r.business_type
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN restaurants r ON r.id = u.restaurant_id
       WHERE s.token = ?`
    )
    .get(token);
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    deleteSession(token);
    return null;
  }
  return row;
}

export function deleteSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}
