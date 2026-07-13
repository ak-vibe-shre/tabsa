import db from '../../db/client.js';
import { getBusinessType } from '../../lib/businessTypes.js';

const CORE_COLUMNS = ['category_id', 'name', 'description', 'price', 'tax_percent', 'image_url'];

export function listProducts(businessType, restaurantId, { category_id, available } = {}) {
  const { table } = getBusinessType(businessType);
  let sql = `SELECT * FROM ${table} WHERE restaurant_id = ?`;
  const params = [restaurantId];
  if (category_id) {
    sql += ' AND category_id = ?';
    params.push(category_id);
  }
  if (available !== undefined) {
    sql += ' AND is_available = ?';
    params.push(available ? 1 : 0);
  }
  sql += ' ORDER BY name ASC';
  return db.prepare(sql).all(...params);
}

export function getProduct(businessType, id, restaurantId) {
  const { table } = getBusinessType(businessType);
  return db.prepare(`SELECT * FROM ${table} WHERE id = ? AND restaurant_id = ?`).get(id, restaurantId);
}

export function createProduct(businessType, restaurantId, data) {
  const { table, productFields } = getBusinessType(businessType);
  const verticalKeys = productFields.map((f) => f.key);
  const columns = ['restaurant_id', ...CORE_COLUMNS, ...verticalKeys];
  const values = columns.map((col) => {
    if (col === 'restaurant_id') return restaurantId;
    if (col === 'tax_percent') return data.tax_percent ?? 5;
    if (col === 'safety_certified') return data.safety_certified ? 1 : 0;
    return data[col] ?? null;
  });
  const placeholders = columns.map(() => '?').join(', ');
  const { lastInsertRowid } = db
    .prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`)
    .run(...values);
  return getProduct(businessType, lastInsertRowid, restaurantId);
}

export function updateProduct(businessType, id, restaurantId, data) {
  const { table, productFields } = getBusinessType(businessType);
  const current = getProduct(businessType, id, restaurantId);
  if (!current) return null;
  const verticalKeys = productFields.map((f) => f.key);
  const editableColumns = [...CORE_COLUMNS, 'is_available', ...verticalKeys];
  const values = editableColumns.map((col) => {
    if (col === 'safety_certified' && data.safety_certified !== undefined) return data.safety_certified ? 1 : 0;
    if (col === 'is_available' && data.is_available !== undefined) return data.is_available ? 1 : 0;
    return data[col] ?? current[col];
  });
  const sets = editableColumns.map((col) => `${col} = ?`).join(', ');
  db.prepare(`UPDATE ${table} SET ${sets}, updated_at = datetime('now') WHERE id = ? AND restaurant_id = ?`).run(
    ...values,
    id,
    restaurantId
  );
  return getProduct(businessType, id, restaurantId);
}

export function setAvailability(businessType, id, restaurantId, isAvailable) {
  const { table } = getBusinessType(businessType);
  const current = getProduct(businessType, id, restaurantId);
  if (!current) return null;
  db.prepare(`UPDATE ${table} SET is_available = ?, updated_at = datetime('now') WHERE id = ? AND restaurant_id = ?`).run(
    isAvailable ? 1 : 0,
    id,
    restaurantId
  );
  return getProduct(businessType, id, restaurantId);
}

export function deleteProduct(businessType, id, restaurantId) {
  const { table } = getBusinessType(businessType);
  const result = db.prepare(`DELETE FROM ${table} WHERE id = ? AND restaurant_id = ?`).run(id, restaurantId);
  return result.changes > 0;
}
