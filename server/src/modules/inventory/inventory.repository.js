import db from '../../db/client.js';

export function listInventory(restaurantId, { lowStock } = {}) {
  let sql = 'SELECT * FROM inventory_items WHERE restaurant_id = ?';
  const params = [restaurantId];
  if (lowStock) sql += ' AND current_stock <= low_stock_threshold';
  sql += ' ORDER BY name ASC';
  return db.prepare(sql).all(...params);
}

export function getInventoryItem(id, restaurantId) {
  return db.prepare('SELECT * FROM inventory_items WHERE id = ? AND restaurant_id = ?').get(id, restaurantId);
}

export function createInventoryItem(restaurantId, { name, unit, current_stock = 0, low_stock_threshold = 0 }) {
  const { lastInsertRowid } = db
    .prepare(
      'INSERT INTO inventory_items (restaurant_id, name, unit, current_stock, low_stock_threshold) VALUES (?, ?, ?, ?, ?)'
    )
    .run(restaurantId, name, unit, current_stock, low_stock_threshold);
  return getInventoryItem(lastInsertRowid, restaurantId);
}

export function updateInventoryItem(id, restaurantId, { name, unit, low_stock_threshold }) {
  const current = getInventoryItem(id, restaurantId);
  if (!current) return null;
  db.prepare(
    "UPDATE inventory_items SET name = ?, unit = ?, low_stock_threshold = ?, updated_at = datetime('now') WHERE id = ? AND restaurant_id = ?"
  ).run(name ?? current.name, unit ?? current.unit, low_stock_threshold ?? current.low_stock_threshold, id, restaurantId);
  return getInventoryItem(id, restaurantId);
}

export function deleteInventoryItem(id, restaurantId) {
  const result = db.prepare('DELETE FROM inventory_items WHERE id = ? AND restaurant_id = ?').run(id, restaurantId);
  return result.changes > 0;
}

export function listTransactions(inventoryItemId) {
  return db
    .prepare('SELECT * FROM stock_transactions WHERE inventory_item_id = ? ORDER BY created_at DESC, id DESC')
    .all(inventoryItemId);
}

const addTransactionTx = db.transaction((inventoryItemId, restaurantId, type, quantity, note) => {
  const item = getInventoryItem(inventoryItemId, restaurantId);
  if (!item) throw new Error('Inventory item not found');

  let nextStock = item.current_stock;
  if (type === 'stock_in') nextStock += quantity;
  else if (type === 'stock_out') nextStock -= quantity;
  else if (type === 'adjustment') nextStock = quantity;

  if (nextStock < 0) throw new Error('Stock cannot go below zero');

  db.prepare('INSERT INTO stock_transactions (inventory_item_id, type, quantity, note) VALUES (?, ?, ?, ?)').run(
    inventoryItemId,
    type,
    quantity,
    note ?? null
  );
  db.prepare("UPDATE inventory_items SET current_stock = ?, updated_at = datetime('now') WHERE id = ?").run(
    nextStock,
    inventoryItemId
  );

  return getInventoryItem(inventoryItemId, restaurantId);
});

export function addTransaction(inventoryItemId, restaurantId, { type, quantity, note }) {
  return addTransactionTx(inventoryItemId, restaurantId, type, quantity, note);
}
