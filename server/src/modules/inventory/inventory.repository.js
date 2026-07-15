import prisma from '../../db/prisma.js';

export async function listInventory(restaurantId, { lowStock } = {}) {
  const items = await prisma.inventoryItem.findMany({
    where: { restaurant_id: restaurantId },
    orderBy: { name: 'asc' },
  });
  if (!lowStock) return items;
  return items.filter((item) => item.current_stock <= item.low_stock_threshold);
}

export async function getInventoryItem(id, restaurantId, client = prisma) {
  return client.inventoryItem.findFirst({ where: { id, restaurant_id: restaurantId } });
}

export async function createInventoryItem(restaurantId, { name, unit, current_stock = 0, low_stock_threshold = 0 }) {
  const created = await prisma.inventoryItem.create({
    data: { restaurant_id: restaurantId, name, unit, current_stock, low_stock_threshold },
  });
  return getInventoryItem(created.id, restaurantId);
}

export async function updateInventoryItem(id, restaurantId, { name, unit, low_stock_threshold }) {
  const current = await getInventoryItem(id, restaurantId);
  if (!current) return null;
  return prisma.inventoryItem.update({
    where: { id },
    data: {
      name: name ?? current.name,
      unit: unit ?? current.unit,
      low_stock_threshold: low_stock_threshold ?? current.low_stock_threshold,
    },
  });
}

export async function deleteInventoryItem(id, restaurantId) {
  const { count } = await prisma.inventoryItem.deleteMany({ where: { id, restaurant_id: restaurantId } });
  return count > 0;
}

export async function listTransactions(inventoryItemId) {
  return prisma.stockTransaction.findMany({
    where: { inventory_item_id: inventoryItemId },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
  });
}

export async function addTransaction(inventoryItemId, restaurantId, { type, quantity, note }) {
  return prisma.$transaction(async (tx) => {
    const item = await getInventoryItem(inventoryItemId, restaurantId, tx);
    if (!item) throw new Error('Inventory item not found');

    let nextStock = item.current_stock;
    if (type === 'stock_in') nextStock += quantity;
    else if (type === 'stock_out') nextStock -= quantity;
    else if (type === 'adjustment') nextStock = quantity;

    if (nextStock < 0) throw new Error('Stock cannot go below zero');

    await tx.stockTransaction.create({
      data: { inventory_item_id: inventoryItemId, type, quantity, note: note ?? null },
    });
    await tx.inventoryItem.update({ where: { id: inventoryItemId }, data: { current_stock: nextStock } });

    return getInventoryItem(inventoryItemId, restaurantId, tx);
  });
}
