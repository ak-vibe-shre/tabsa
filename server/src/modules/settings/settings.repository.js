import db from '../../db/client.js';
import { getTableLimit } from '../../lib/planLimits.js';

export function getSettings(restaurantId) {
  const row = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurantId);
  if (!row) return {};
  const { count: table_count } = db
    .prepare('SELECT COUNT(*) as count FROM dining_tables WHERE restaurant_id = ?')
    .get(restaurantId);
  return {
    restaurant_name: row.name,
    restaurant_address: row.address,
    restaurant_phone: row.phone,
    enabled_modules: JSON.parse(row.enabled_modules || '[]'),
    subscription_plan: row.subscription_plan,
    business_type: row.business_type,
    table_count,
    table_limit: getTableLimit(row.subscription_plan),
  };
}

export function updateSettings(restaurantId, partial) {
  const current = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurantId);
  if (!current) return {};

  const next = {
    name: partial.restaurant_name ?? current.name,
    address: partial.restaurant_address ?? current.address,
    phone: partial.restaurant_phone ?? current.phone,
    enabled_modules:
      partial.enabled_modules !== undefined ? JSON.stringify(partial.enabled_modules) : current.enabled_modules,
    subscription_plan: partial.subscription_plan ?? current.subscription_plan,
  };

  db.prepare(
    `UPDATE restaurants SET name = ?, address = ?, phone = ?, enabled_modules = ?, subscription_plan = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(next.name, next.address, next.phone, next.enabled_modules, next.subscription_plan, restaurantId);

  return getSettings(restaurantId);
}
