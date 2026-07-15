import prisma from '../../db/prisma.js';

export async function getOrderRow(id, restaurantId, client = prisma) {
  const order = await client.order.findFirst({
    where: { id, restaurant_id: restaurantId },
    include: { table: { select: { label: true } } },
  });
  if (!order) return null;
  const { table, ...rest } = order;
  return { ...rest, table_label: table?.label ?? null };
}

export async function getOrderItems(orderId, client = prisma) {
  return client.orderItem.findMany({ where: { order_id: orderId }, orderBy: { id: 'asc' } });
}

export async function getOrderWithItems(id, restaurantId, client = prisma) {
  const order = await getOrderRow(id, restaurantId, client);
  if (!order) return null;
  return { ...order, items: await getOrderItems(id, client) };
}

export async function listOrders(restaurantId, { status, table_id, date } = {}, client = prisma) {
  const where = { restaurant_id: restaurantId };
  if (status) where.status = status;
  if (table_id) where.table_id = table_id;
  if (date) {
    const gte = new Date(`${date}T00:00:00.000Z`);
    const lt = new Date(gte);
    lt.setUTCDate(lt.getUTCDate() + 1);
    where.created_at = { gte, lt };
  }
  const orders = await client.order.findMany({
    where,
    include: { table: { select: { label: true } }, _count: { select: { order_items: true } } },
    orderBy: { created_at: 'desc' },
  });
  return orders.map(({ table, _count, ...rest }) => ({
    ...rest,
    table_label: table?.label ?? null,
    item_count: _count.order_items,
  }));
}

export async function insertOrder(restaurantId, { table_id, order_type }, client = prisma) {
  const order = await client.order.create({
    data: {
      restaurant_id: restaurantId,
      table_id: table_id ?? null,
      order_type: order_type ?? 'dine_in',
      status: 'open',
    },
  });
  return getOrderRow(order.id, restaurantId, client);
}

export async function findOrderItemByProduct(orderId, productId, client = prisma) {
  return client.orderItem.findFirst({ where: { order_id: orderId, product_id: productId } });
}

export async function insertOrderItem(
  orderId,
  { product_id, item_name_snapshot, unit_price, tax_percent, quantity, notes },
  client = prisma
) {
  return client.orderItem.create({
    data: { order_id: orderId, product_id, item_name_snapshot, unit_price, tax_percent, quantity, notes: notes ?? null },
  });
}

export async function updateOrderItem(id, { quantity, notes }, client = prisma) {
  const current = await client.orderItem.findUnique({ where: { id } });
  if (!current) return null;
  return client.orderItem.update({
    where: { id },
    data: { quantity: quantity ?? current.quantity, notes: notes ?? current.notes },
  });
}

export async function deleteOrderItem(id, client = prisma) {
  const { count } = await client.orderItem.deleteMany({ where: { id } });
  return count > 0;
}

export async function updateOrderTotals(orderId, { subtotal, tax_total, grand_total }, client = prisma) {
  await client.order.update({ where: { id: orderId }, data: { subtotal, tax_total, grand_total } });
}

export async function transitionOrder(orderId, fields, client = prisma) {
  return client.order.update({ where: { id: orderId }, data: fields });
}

export async function setTableStatus(tableId, status, currentOrderId, client = prisma) {
  if (tableId == null) return;
  await client.diningTable.update({
    where: { id: tableId },
    data: { status, current_order_id: currentOrderId ?? null },
  });
}

export async function getTableRow(id, restaurantId, client = prisma) {
  return client.diningTable.findFirst({ where: { id, restaurant_id: restaurantId } });
}
