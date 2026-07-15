import prisma from '../../db/prisma.js';
import { getTableLimit } from '../../lib/planLimits.js';

export async function getSettings(restaurantId) {
  const row = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!row) return {};
  const table_count = await prisma.diningTable.count({ where: { restaurant_id: restaurantId } });
  return {
    restaurant_name: row.name,
    restaurant_address: row.address,
    restaurant_phone: row.phone,
    enabled_modules: row.enabled_modules,
    subscription_plan: row.subscription_plan,
    business_type: row.business_type,
    table_count,
    table_limit: await getTableLimit(row.subscription_plan),
  };
}

// subscription_plan is intentionally not settable here — only platform_admin
// can change a restaurant's plan, via PATCH /api/admin/restaurants/:id.
export async function updateSettings(restaurantId, partial) {
  const current = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!current) return {};

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      name: partial.restaurant_name ?? current.name,
      address: partial.restaurant_address ?? current.address,
      phone: partial.restaurant_phone ?? current.phone,
      enabled_modules: partial.enabled_modules !== undefined ? partial.enabled_modules : current.enabled_modules,
    },
  });

  return getSettings(restaurantId);
}
