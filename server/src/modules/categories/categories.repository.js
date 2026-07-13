import db from '../../db/client.js';

export function listCategories(restaurantId) {
  return db.prepare('SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order ASC, id ASC').all(restaurantId);
}

export function getCategory(id, restaurantId) {
  return db.prepare('SELECT * FROM categories WHERE id = ? AND restaurant_id = ?').get(id, restaurantId);
}

export function createCategory(restaurantId, { name, sort_order = 0 }) {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO categories (restaurant_id, name, sort_order) VALUES (?, ?, ?)')
    .run(restaurantId, name, sort_order);
  return getCategory(lastInsertRowid, restaurantId);
}

export function updateCategory(id, restaurantId, { name, sort_order }) {
  const current = getCategory(id, restaurantId);
  if (!current) return null;
  db.prepare(
    "UPDATE categories SET name = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ? AND restaurant_id = ?"
  ).run(name ?? current.name, sort_order ?? current.sort_order, id, restaurantId);
  return getCategory(id, restaurantId);
}

export function deleteCategory(id, restaurantId) {
  const result = db.prepare('DELETE FROM categories WHERE id = ? AND restaurant_id = ?').run(id, restaurantId);
  return result.changes > 0;
}
