import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import db from '../../db/client.js';
import { getTableLimit } from '../../lib/planLimits.js';
import { BUSINESS_TYPES } from '../../lib/businessTypes.js';

// Built once from the static registry — table names here never come from request input.
const PRODUCT_COUNT_CASE = Object.values(BUSINESS_TYPES)
  .map((bt) => `WHEN '${bt.key}' THEN (SELECT COUNT(*) FROM ${bt.table} WHERE ${bt.table}.restaurant_id = r.id)`)
  .join(' ');
const PRODUCT_COUNT_UNION = Object.values(BUSINESS_TYPES)
  .map((bt) => `SELECT COUNT(*) AS c FROM ${bt.table}`)
  .join(' UNION ALL ');

export function listRestaurants() {
  const rows = db
    .prepare(
      `SELECT
         r.id, r.name, r.status, r.subscription_plan, r.business_type, r.created_at,
         u.username AS owner_username,
         (CASE r.business_type ${PRODUCT_COUNT_CASE} ELSE 0 END) AS product_count,
         (SELECT COUNT(*) FROM dining_tables WHERE dining_tables.restaurant_id = r.id) AS table_count,
         (SELECT COUNT(*) FROM orders WHERE orders.restaurant_id = r.id) AS order_count
       FROM restaurants r
       LEFT JOIN users u ON u.restaurant_id = r.id AND u.role = 'owner'
       ORDER BY r.created_at DESC`
    )
    .all();
  return rows.map((row) => ({ ...row, table_limit: getTableLimit(row.subscription_plan) }));
}

function generatePassword() {
  return crypto.randomBytes(6).toString('hex');
}

export function createRestaurantWithOwner({ name, username, business_type }) {
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) throw new Error('That username is already taken');

  const password = generatePassword();
  const passwordHash = bcrypt.hashSync(password, 10);

  const { lastInsertRowid: restaurantId } = db
    .prepare('INSERT INTO restaurants (name, business_type) VALUES (?, ?)')
    .run(name, business_type);
  db.prepare("INSERT INTO users (restaurant_id, username, password_hash, role) VALUES (?, ?, ?, 'owner')").run(
    restaurantId,
    username,
    passwordHash
  );

  return { id: restaurantId, name, username, password };
}

export function getPlatformStats() {
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS total,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended
       FROM restaurants`
    )
    .get();
  const { staff_count } = db.prepare('SELECT COUNT(*) AS staff_count FROM users WHERE restaurant_id IS NOT NULL').get();
  const { table_count } = db.prepare('SELECT COUNT(*) AS table_count FROM dining_tables').get();
  const { product_count } = db
    .prepare(`SELECT COALESCE(SUM(c), 0) AS product_count FROM (${PRODUCT_COUNT_UNION})`)
    .get();
  const { order_count } = db.prepare('SELECT COUNT(*) AS order_count FROM orders').get();
  const planDistribution = db
    .prepare('SELECT subscription_plan AS plan, COUNT(*) AS count FROM restaurants GROUP BY subscription_plan')
    .all();
  const businessTypeDistribution = db
    .prepare('SELECT business_type, COUNT(*) AS count FROM restaurants GROUP BY business_type')
    .all();

  return {
    restaurants: { total: totals.total, active: totals.active ?? 0, suspended: totals.suspended ?? 0 },
    staff_count,
    table_count,
    product_count,
    order_count,
    plan_distribution: planDistribution,
    business_type_distribution: businessTypeDistribution,
  };
}

export function updateRestaurant(id, { status, subscription_plan, business_type }) {
  const current = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(id);
  if (!current) return null;
  db.prepare(
    "UPDATE restaurants SET status = ?, subscription_plan = ?, business_type = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status ?? current.status, subscription_plan ?? current.subscription_plan, business_type ?? current.business_type, id);
  return db.prepare('SELECT * FROM restaurants WHERE id = ?').get(id);
}
