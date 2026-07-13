import db from '../../db/client.js';
import { getBusinessType } from '../../lib/businessTypes.js';

function normalizeRange({ from, to }) {
  const toDate = to || new Date().toISOString().slice(0, 10);
  const fromDate = from || new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { from: fromDate, to: toDate };
}

export function getSummary(restaurantId, range) {
  const { from, to } = normalizeRange(range);
  const row = db
    .prepare(
      `SELECT COUNT(*) as orders_count, COALESCE(SUM(grand_total), 0) as revenue
       FROM orders
       WHERE restaurant_id = ? AND status = 'paid' AND date(paid_at) BETWEEN date(?) AND date(?)`
    )
    .get(restaurantId, from, to);
  const avgOrderValue = row.orders_count > 0 ? row.revenue / row.orders_count : 0;
  return {
    from,
    to,
    revenue: Math.round(row.revenue * 100) / 100,
    orders_count: row.orders_count,
    avg_order_value: Math.round(avgOrderValue * 100) / 100,
  };
}

export function getSalesTrend(restaurantId, range) {
  const { from, to } = normalizeRange(range);
  return db
    .prepare(
      `SELECT date(paid_at) as day, COALESCE(SUM(grand_total), 0) as revenue, COUNT(*) as orders_count
       FROM orders
       WHERE restaurant_id = ? AND status = 'paid' AND date(paid_at) BETWEEN date(?) AND date(?)
       GROUP BY date(paid_at)
       ORDER BY day ASC`
    )
    .all(restaurantId, from, to);
}

export function getTopItems(restaurantId, range, limit = 10) {
  const { from, to } = normalizeRange(range);
  return db
    .prepare(
      `SELECT oi.item_name_snapshot as name, SUM(oi.quantity) as quantity, SUM(oi.unit_price * oi.quantity) as revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.restaurant_id = ? AND o.status = 'paid' AND date(o.paid_at) BETWEEN date(?) AND date(?)
       GROUP BY oi.item_name_snapshot
       ORDER BY revenue DESC
       LIMIT ?`
    )
    .all(restaurantId, from, to, limit);
}

export function getCategoryRevenue(businessType, restaurantId, range) {
  const { table } = getBusinessType(businessType);
  const { from, to } = normalizeRange(range);
  return db
    .prepare(
      `SELECT c.name as category, COALESCE(SUM(oi.unit_price * oi.quantity), 0) as revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN ${table} p ON p.id = oi.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE o.restaurant_id = ? AND o.status = 'paid' AND date(o.paid_at) BETWEEN date(?) AND date(?)
       GROUP BY c.name
       ORDER BY revenue DESC`
    )
    .all(restaurantId, from, to);
}
