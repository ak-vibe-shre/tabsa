import db from '../../db/client.js';
import { getTableLimit } from '../../lib/planLimits.js';

export function listTables(restaurantId) {
  return db.prepare('SELECT * FROM dining_tables WHERE restaurant_id = ? ORDER BY label ASC').all(restaurantId);
}

export function getTable(id, restaurantId) {
  return db.prepare('SELECT * FROM dining_tables WHERE id = ? AND restaurant_id = ?').get(id, restaurantId);
}

export function getTableUsage(restaurantId) {
  const restaurant = db.prepare('SELECT subscription_plan FROM restaurants WHERE id = ?').get(restaurantId);
  const plan = restaurant?.subscription_plan ?? 'starter';
  const { count } = db.prepare('SELECT COUNT(*) as count FROM dining_tables WHERE restaurant_id = ?').get(restaurantId);
  return { plan, count, limit: getTableLimit(plan) };
}

export function createTable(restaurantId, { label, seats = 4 }) {
  const usage = getTableUsage(restaurantId);
  if (usage.limit != null && usage.count >= usage.limit) {
    throw new Error(`Table limit reached for the ${usage.plan} plan (${usage.limit} tables). Upgrade to add more tables.`);
  }
  const { lastInsertRowid } = db
    .prepare('INSERT INTO dining_tables (restaurant_id, label, seats) VALUES (?, ?, ?)')
    .run(restaurantId, label, seats);
  return getTable(lastInsertRowid, restaurantId);
}

export function updateTable(id, restaurantId, { label, seats }) {
  const current = getTable(id, restaurantId);
  if (!current) return null;
  db.prepare(
    "UPDATE dining_tables SET label = ?, seats = ?, updated_at = datetime('now') WHERE id = ? AND restaurant_id = ?"
  ).run(label ?? current.label, seats ?? current.seats, id, restaurantId);
  return getTable(id, restaurantId);
}

export function deleteTable(id, restaurantId) {
  const result = db.prepare('DELETE FROM dining_tables WHERE id = ? AND restaurant_id = ?').run(id, restaurantId);
  return result.changes > 0;
}

export function lockTable(id, restaurantId, note) {
  const current = getTable(id, restaurantId);
  if (!current) return null;
  if (current.status !== 'available') {
    throw new Error(`Table ${current.label} is ${current.status}; only available tables can be locked`);
  }
  db.prepare(
    "UPDATE dining_tables SET status = 'locked', lock_note = ?, updated_at = datetime('now') WHERE id = ? AND restaurant_id = ?"
  ).run(note ?? null, id, restaurantId);
  return getTable(id, restaurantId);
}

export function releaseTable(id, restaurantId) {
  const current = getTable(id, restaurantId);
  if (!current) return null;
  if (current.status !== 'locked') {
    throw new Error(`Table ${current.label} is not locked`);
  }
  db.prepare(
    "UPDATE dining_tables SET status = 'available', lock_note = NULL, updated_at = datetime('now') WHERE id = ? AND restaurant_id = ?"
  ).run(id, restaurantId);
  return getTable(id, restaurantId);
}
