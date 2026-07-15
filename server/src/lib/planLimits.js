import prisma from '../db/prisma.js';

export async function getTableLimit(plan) {
  const row = await prisma.plan.findUnique({ where: { key: plan }, select: { table_limit: true } });
  return row ? row.table_limit : null;
}
