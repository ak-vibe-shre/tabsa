import prisma from '../../db/prisma.js';

export async function listCategories(restaurantId) {
  return prisma.category.findMany({
    where: { restaurant_id: restaurantId },
    orderBy: [{ sort_order: 'asc' }, { id: 'asc' }],
  });
}

export async function getCategory(id, restaurantId) {
  return prisma.category.findFirst({ where: { id, restaurant_id: restaurantId } });
}

export async function createCategory(restaurantId, { name, sort_order = 0 }) {
  return prisma.category.create({ data: { restaurant_id: restaurantId, name, sort_order } });
}

export async function updateCategory(id, restaurantId, { name, sort_order }) {
  const current = await getCategory(id, restaurantId);
  if (!current) return null;
  return prisma.category.update({
    where: { id },
    data: { name: name ?? current.name, sort_order: sort_order ?? current.sort_order },
  });
}

export async function deleteCategory(id, restaurantId) {
  const { count } = await prisma.category.deleteMany({ where: { id, restaurant_id: restaurantId } });
  return count > 0;
}
