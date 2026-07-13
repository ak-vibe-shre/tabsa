import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import db from '../../db/client.js';

export const STAFF_ROLES = ['manager', 'staff'];

function generatePassword() {
  return crypto.randomBytes(6).toString('hex');
}

export function listStaff(restaurantId) {
  return db
    .prepare(
      "SELECT id, username, role, created_at FROM users WHERE restaurant_id = ? AND role != 'owner' ORDER BY created_at ASC"
    )
    .all(restaurantId);
}

export function createStaff(restaurantId, { username, role }) {
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) throw new Error('That username is already taken');

  const password = generatePassword();
  const passwordHash = bcrypt.hashSync(password, 10);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (restaurant_id, username, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(restaurantId, username, passwordHash, role);

  return { id: lastInsertRowid, username, role, password };
}

export function updateStaffRole(id, restaurantId, role) {
  const current = db
    .prepare("SELECT id FROM users WHERE id = ? AND restaurant_id = ? AND role != 'owner'")
    .get(id, restaurantId);
  if (!current) return null;
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  return db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id);
}

export function deleteStaff(id, restaurantId) {
  const result = db.prepare("DELETE FROM users WHERE id = ? AND restaurant_id = ? AND role != 'owner'").run(id, restaurantId);
  return result.changes > 0;
}
