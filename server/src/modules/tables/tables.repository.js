import prisma from '../../db/prisma.js';
import { getTableLimit } from '../../lib/planLimits.js';

export async function listTables(restaurantId) {
  return prisma.diningTable.findMany({ where: { restaurant_id: restaurantId }, orderBy: { label: 'asc' } });
}

export async function getTable(id, restaurantId) {
  return prisma.diningTable.findFirst({ where: { id, restaurant_id: restaurantId } });
}

export async function getTableUsage(restaurantId) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  const plan = restaurant?.subscription_plan ?? 'starter';
  const count = await prisma.diningTable.count({ where: { restaurant_id: restaurantId } });
  return { plan, count, limit: await getTableLimit(plan) };
}

export async function createTable(restaurantId, { label, seats = 4 }) {
  const usage = await getTableUsage(restaurantId);
  if (usage.limit != null && usage.count >= usage.limit) {
    throw new Error(`Table limit reached for the ${usage.plan} plan (${usage.limit} tables). Upgrade to add more tables.`);
  }
  return prisma.diningTable.create({ data: { restaurant_id: restaurantId, label, seats } });
}

export async function updateTable(id, restaurantId, { label, seats }) {
  const current = await getTable(id, restaurantId);
  if (!current) return null;
  return prisma.diningTable.update({
    where: { id },
    data: { label: label ?? current.label, seats: seats ?? current.seats },
  });
}

export async function deleteTable(id, restaurantId) {
  const { count } = await prisma.diningTable.deleteMany({ where: { id, restaurant_id: restaurantId } });
  return count > 0;
}

export async function lockTable(id, restaurantId, note) {
  const current = await getTable(id, restaurantId);
  if (!current) return null;
  if (current.status !== 'available') {
    throw new Error(`Table ${current.label} is ${current.status}; only available tables can be locked`);
  }
  return prisma.diningTable.update({
    where: { id },
    data: { status: 'locked', lock_note: note ?? null },
  });
}

export async function releaseTable(id, restaurantId) {
  const current = await getTable(id, restaurantId);
  if (!current) return null;
  if (current.status !== 'locked') {
    throw new Error(`Table ${current.label} is not locked`);
  }
  return prisma.diningTable.update({
    where: { id },
    data: { status: 'available', lock_note: null },
  });
}
