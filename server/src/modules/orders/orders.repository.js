import db from '../../db/client.js';

export function getOrderRow(id, restaurantId) {
  return db
    .prepare(
      `SELECT orders.*, dining_tables.label AS table_label
       FROM orders
       LEFT JOIN dining_tables ON dining_tables.id = orders.table_id
       WHERE orders.id = ? AND orders.restaurant_id = ?`
    )
    .get(id, restaurantId);
}

export function getOrderItems(orderId) {
  return db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC').all(orderId);
}

export function getOrderWithItems(id, restaurantId) {
  const order = getOrderRow(id, restaurantId);
  if (!order) return null;
  return { ...order, items: getOrderItems(id) };
}

export function listOrders(restaurantId, { status, table_id, date } = {}) {
  let sql = `SELECT orders.*,
               (SELECT COUNT(*) FROM order_items WHERE order_items.order_id = orders.id) AS item_count,
               dining_tables.label AS table_label
             FROM orders
             LEFT JOIN dining_tables ON dining_tables.id = orders.table_id
             WHERE orders.restaurant_id = ?`;
  const params = [restaurantId];
  if (status) {
    sql += ' AND orders.status = ?';
    params.push(status);
  }
  if (table_id) {
    sql += ' AND orders.table_id = ?';
    params.push(table_id);
  }
  if (date) {
    sql += ' AND date(orders.created_at) = date(?)';
    params.push(date);
  }
  sql += ' ORDER BY orders.created_at DESC';
  return db.prepare(sql).all(...params);
}

export function insertOrder(restaurantId, { table_id, order_type }) {
  const { lastInsertRowid } = db
    .prepare("INSERT INTO orders (restaurant_id, table_id, order_type, status) VALUES (?, ?, ?, 'open')")
    .run(restaurantId, table_id ?? null, order_type ?? 'dine_in');
  return getOrderRow(lastInsertRowid, restaurantId);
}

export function findOrderItemByProduct(orderId, productId) {
  return db.prepare('SELECT * FROM order_items WHERE order_id = ? AND product_id = ?').get(orderId, productId);
}

export function insertOrderItem(orderId, { product_id, item_name_snapshot, unit_price, tax_percent, quantity, notes }) {
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO order_items (order_id, product_id, item_name_snapshot, unit_price, tax_percent, quantity, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(orderId, product_id, item_name_snapshot, unit_price, tax_percent, quantity, notes ?? null);
  return db.prepare('SELECT * FROM order_items WHERE id = ?').get(lastInsertRowid);
}

export function updateOrderItem(id, { quantity, notes }) {
  const current = db.prepare('SELECT * FROM order_items WHERE id = ?').get(id);
  if (!current) return null;
  db.prepare("UPDATE order_items SET quantity = ?, notes = ?, updated_at = datetime('now') WHERE id = ?").run(
    quantity ?? current.quantity,
    notes ?? current.notes,
    id
  );
  return db.prepare('SELECT * FROM order_items WHERE id = ?').get(id);
}

export function deleteOrderItem(id) {
  const result = db.prepare('DELETE FROM order_items WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateOrderTotals(orderId, { subtotal, tax_total, grand_total }) {
  db.prepare(
    "UPDATE orders SET subtotal = ?, tax_total = ?, grand_total = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(subtotal, tax_total, grand_total, orderId);
}

export function transitionOrder(orderId, fields) {
  const sets = Object.keys(fields)
    .map((key) => `${key} = ?`)
    .join(', ');
  const values = Object.values(fields);
  db.prepare(`UPDATE orders SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...values, orderId);
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
}

export function setTableStatus(tableId, status, currentOrderId) {
  if (tableId == null) return;
  db.prepare(
    "UPDATE dining_tables SET status = ?, current_order_id = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status, currentOrderId ?? null, tableId);
}

export function getTableRow(id, restaurantId) {
  return db.prepare('SELECT * FROM dining_tables WHERE id = ? AND restaurant_id = ?').get(id, restaurantId);
}
