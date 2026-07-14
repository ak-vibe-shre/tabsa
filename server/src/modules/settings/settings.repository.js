import db from '../../db/client.js';
import { getTableLimit } from '../../lib/planLimits.js';
import { resolveNavVisibility } from '../../lib/navItems.js';

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
    nav_visibility: resolveNavVisibility(row.nav_visibility),
    subscription_plan: row.subscription_plan,
    business_type: row.business_type,
    table_count,
    table_limit: getTableLimit(row.subscription_plan),
  };
}

// subscription_plan is intentionally not settable here — only platform_admin
// can change a restaurant's plan, via PATCH /api/admin/restaurants/:id.
export function updateSettings(restaurantId, partial) {
  const current = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurantId);
  if (!current) return {};

  const next = {
    name: partial.restaurant_name ?? current.name,
    address: partial.restaurant_address ?? current.address,
    phone: partial.restaurant_phone ?? current.phone,
    enabled_modules:
      partial.enabled_modules !== undefined ? JSON.stringify(partial.enabled_modules) : current.enabled_modules,
    nav_visibility:
      partial.nav_visibility !== undefined ? JSON.stringify(partial.nav_visibility) : current.nav_visibility,
  };

  db.prepare(
    `UPDATE restaurants SET name = ?, address = ?, phone = ?, enabled_modules = ?, nav_visibility = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(next.name, next.address, next.phone, next.enabled_modules, next.nav_visibility, restaurantId);

  return getSettings(restaurantId);
}
