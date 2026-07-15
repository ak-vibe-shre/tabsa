import prisma from '../../db/prisma.js';
import { HttpError } from '../../middleware/httpError.js';
import { getProduct } from '../products/products.repository.js';
import {
  getOrderRow,
  getOrderWithItems,
  getOrderItems,
  insertOrder,
  findOrderItemByProduct,
  insertOrderItem,
  updateOrderItem,
  deleteOrderItem,
  updateOrderTotals,
  transitionOrder,
  setTableStatus,
  getTableRow,
} from './orders.repository.js';

function round2(n) {
  return Math.round(n * 100) / 100;
}

function computeTotals(items) {
  let subtotal = 0;
  let taxTotal = 0;
  for (const item of items) {
    const lineSubtotal = item.unit_price * item.quantity;
    const lineTax = round2((lineSubtotal * item.tax_percent) / 100);
    subtotal += lineSubtotal;
    taxTotal += lineTax;
  }
  subtotal = round2(subtotal);
  taxTotal = round2(taxTotal);
  return { subtotal, tax_total: taxTotal, grand_total: round2(subtotal + taxTotal) };
}

async function recalcAndPersistTotals(orderId, client) {
  const items = await getOrderItems(orderId, client);
  const totals = computeTotals(items);
  await updateOrderTotals(orderId, totals, client);
  return totals;
}

async function requireOpenOrder(orderId, restaurantId, client) {
  const order = await getOrderRow(orderId, restaurantId, client);
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status !== 'open') throw new HttpError(400, `Order is ${order.status}; items can only be edited while open`);
  return order;
}

export async function createOrder(restaurantId, { table_id, order_type }) {
  return prisma.$transaction(async (tx) => {
    if (table_id) {
      const table = await getTableRow(table_id, restaurantId, tx);
      if (!table) throw new HttpError(404, 'Table not found');
      if (table.status !== 'available') throw new HttpError(409, `Table ${table.label} is already ${table.status}`);
    }
    const order = await insertOrder(restaurantId, { table_id, order_type }, tx);
    if (table_id) await setTableStatus(table_id, 'occupied', order.id, tx);
    return getOrderWithItems(order.id, restaurantId, tx);
  });
}

export async function addOrderItem(businessType, restaurantId, orderId, { product_id, quantity = 1, notes }) {
  return prisma.$transaction(async (tx) => {
    await requireOpenOrder(orderId, restaurantId, tx);
    const product = await getProduct(businessType, product_id, restaurantId, tx);
    if (!product) throw new HttpError(404, 'Product not found');

    const existing = await findOrderItemByProduct(orderId, product_id, tx);
    if (existing) {
      await updateOrderItem(existing.id, { quantity: existing.quantity + quantity, notes: notes ?? existing.notes }, tx);
    } else {
      await insertOrderItem(
        orderId,
        {
          product_id,
          item_name_snapshot: product.name,
          unit_price: product.price,
          tax_percent: product.tax_percent,
          quantity,
          notes,
        },
        tx
      );
    }
    await recalcAndPersistTotals(orderId, tx);
    return getOrderWithItems(orderId, restaurantId, tx);
  });
}

export async function updateOrderItemQuantity(restaurantId, orderId, itemId, { quantity, notes }) {
  return prisma.$transaction(async (tx) => {
    await requireOpenOrder(orderId, restaurantId, tx);
    if (quantity !== undefined && quantity <= 0) {
      await deleteOrderItem(itemId, tx);
    } else {
      const updated = await updateOrderItem(itemId, { quantity, notes }, tx);
      if (!updated) throw new HttpError(404, 'Order item not found');
    }
    await recalcAndPersistTotals(orderId, tx);
    return getOrderWithItems(orderId, restaurantId, tx);
  });
}

export async function removeOrderItem(restaurantId, orderId, itemId) {
  return prisma.$transaction(async (tx) => {
    await requireOpenOrder(orderId, restaurantId, tx);
    const deleted = await deleteOrderItem(itemId, tx);
    if (!deleted) throw new HttpError(404, 'Order item not found');
    await recalcAndPersistTotals(orderId, tx);
    return getOrderWithItems(orderId, restaurantId, tx);
  });
}

export async function billOrder(restaurantId, orderId) {
  return prisma.$transaction(async (tx) => {
    const order = await requireOpenOrder(orderId, restaurantId, tx);
    const items = await getOrderItems(orderId, tx);
    if (items.length === 0) throw new HttpError(400, 'Cannot bill an order with no items');
    const totals = computeTotals(items);
    await updateOrderTotals(orderId, totals, tx);
    await transitionOrder(orderId, { status: 'billed', billed_at: new Date() }, tx);
    if (order.table_id) await setTableStatus(order.table_id, 'billed', orderId, tx);
    return getOrderWithItems(orderId, restaurantId, tx);
  });
}

export async function payOrder(restaurantId, orderId, { payment_method }) {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderRow(orderId, restaurantId, tx);
    if (!order) throw new HttpError(404, 'Order not found');
    if (order.status !== 'billed') throw new HttpError(400, `Order must be billed before it can be paid (currently ${order.status})`);
    if (!['cash', 'card', 'upi'].includes(payment_method)) throw new HttpError(400, 'payment_method must be cash, card, or upi');

    await transitionOrder(orderId, { status: 'paid', payment_method, paid_at: new Date() }, tx);
    if (order.table_id) await setTableStatus(order.table_id, 'available', null, tx);
    return getOrderWithItems(orderId, restaurantId, tx);
  });
}

export async function cancelOrder(restaurantId, orderId) {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderRow(orderId, restaurantId, tx);
    if (!order) throw new HttpError(404, 'Order not found');
    if (!['open', 'billed'].includes(order.status)) throw new HttpError(400, `Order is already ${order.status}`);

    await transitionOrder(orderId, { status: 'cancelled', cancelled_at: new Date() }, tx);
    if (order.table_id) await setTableStatus(order.table_id, 'available', null, tx);
    return getOrderWithItems(orderId, restaurantId, tx);
  });
}
