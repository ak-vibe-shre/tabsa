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

export async function createInventoryItem(restaurantId, { name, unit, current_stock = 0, low_stock_threshold = 0, purchase_price }) {
  const created = await prisma.inventoryItem.create({
    data: { restaurant_id: restaurantId, name, unit, current_stock, low_stock_threshold, purchase_price: purchase_price ?? null },
  });
  return getInventoryItem(created.id, restaurantId);
}

export async function updateInventoryItem(id, restaurantId, { name, unit, low_stock_threshold, purchase_price }) {
  const current = await getInventoryItem(id, restaurantId);
  if (!current) return null;
  return prisma.inventoryItem.update({
    where: { id },
    data: {
      name: name ?? current.name,
      unit: unit ?? current.unit,
      low_stock_threshold: low_stock_threshold ?? current.low_stock_threshold,
      purchase_price: purchase_price !== undefined ? purchase_price : current.purchase_price,
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

export async function addTransaction(inventoryItemId, restaurantId, { type, quantity, note, purchase_price }) {
  return prisma.$transaction(async (tx) => {
    const item = await getInventoryItem(inventoryItemId, restaurantId, tx);
    if (!item) throw new Error('Inventory item not found');

    let nextStock = item.current_stock;
    if (type === 'stock_in') nextStock += quantity;
    else if (type === 'stock_out') nextStock -= quantity;
    else if (type === 'adjustment') nextStock = quantity;

    if (nextStock < 0) throw new Error('Stock cannot go below zero');

    // Only stock_in has a meaningful cost; snapshot whatever price was given
    // (or fall back to the item's last-known price) so a later change to the
    // item's default purchase_price doesn't retroactively rewrite this
    // delivery's recorded cost.
    const txPurchasePrice = type === 'stock_in' ? purchase_price ?? item.purchase_price ?? null : null;

    await tx.stockTransaction.create({
      data: { inventory_item_id: inventoryItemId, type, quantity, note: note ?? null, purchase_price: txPurchasePrice },
    });
    await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        current_stock: nextStock,
        purchase_price: type === 'stock_in' && purchase_price !== undefined ? purchase_price : item.purchase_price,
      },
    });

    return getInventoryItem(inventoryItemId, restaurantId, tx);
  });
}
