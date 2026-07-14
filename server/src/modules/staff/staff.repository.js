import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import db from '../../db/client.js';
import { resolveNavVisibility } from '../../lib/navItems.js';

export const STAFF_ROLES = ['manager', 'staff'];

function generatePassword() {
  return crypto.randomBytes(6).toString('hex');
}

function present(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    nav_visibility: resolveNavVisibility(row.role, row.nav_visibility),
    created_at: row.created_at,
  };
}

export function listStaff(restaurantId) {
  return db
    .prepare(
      "SELECT id, username, role, nav_visibility, created_at FROM users WHERE restaurant_id = ? AND role != 'owner' ORDER BY created_at ASC"
    )
    .all(restaurantId)
    .map(present);
}

export function createStaff(restaurantId, { username, role, nav_visibility }) {
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) throw new Error('That username is already taken');

  const password = generatePassword();
  const passwordHash = bcrypt.hashSync(password, 10);
  const navJson = nav_visibility !== undefined ? JSON.stringify(nav_visibility) : null;
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (restaurant_id, username, password_hash, role, nav_visibility) VALUES (?, ?, ?, ?, ?)')
    .run(restaurantId, username, passwordHash, role, navJson);

  return { ...present({ id: lastInsertRowid, username, role, nav_visibility: navJson, created_at: null }), password };
}

export function updateStaff(id, restaurantId, { role, nav_visibility }) {
  const current = db.prepare("SELECT * FROM users WHERE id = ? AND restaurant_id = ? AND role != 'owner'").get(id, restaurantId);
  if (!current) return null;

  const nextRole = role ?? current.role;
  const nextNav = nav_visibility !== undefined ? JSON.stringify(nav_visibility) : current.nav_visibility;
  db.prepare('UPDATE users SET role = ?, nav_visibility = ? WHERE id = ?').run(nextRole, nextNav, id);

  return present(db.prepare('SELECT id, username, role, nav_visibility, created_at FROM users WHERE id = ?').get(id));
}

export function deleteStaff(id, restaurantId) {
  const result = db.prepare("DELETE FROM users WHERE id = ? AND restaurant_id = ? AND role != 'owner'").run(id, restaurantId);
  return result.changes > 0;
}
