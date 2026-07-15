import prisma from '../../db/prisma.js';

export async function listPlans() {
  return prisma.plan.findMany({ orderBy: { sort_order: 'asc' } });
}

export async function getPlan(key) {
  return prisma.plan.findUnique({ where: { key } });
}

export async function updatePlan(key, { name, price_label, table_limit, features }) {
  const current = await getPlan(key);
  if (!current) return null;
  return prisma.plan.update({
    where: { key },
    data: {
      name: name ?? current.name,
      price_label: price_label ?? current.price_label,
      table_limit: table_limit !== undefined ? table_limit : current.table_limit,
      features: features !== undefined ? features : current.features,
    },
  });
}
