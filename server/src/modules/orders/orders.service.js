import db from '../../db/client.js';
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

function recalcAndPersistTotals(orderId) {
  const items = getOrderItems(orderId);
  const totals = computeTotals(items);
  updateOrderTotals(orderId, totals);
  return totals;
}

function requireOpenOrder(orderId, restaurantId) {
  const order = getOrderRow(orderId, restaurantId);
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status !== 'open') throw new HttpError(400, `Order is ${order.status}; items can only be edited while open`);
  return order;
}

export const createOrder = db.transaction((restaurantId, { table_id, order_type }) => {
  if (table_id) {
    const table = getTableRow(table_id, restaurantId);
    if (!table) throw new HttpError(404, 'Table not found');
    if (table.status !== 'available') throw new HttpError(409, `Table ${table.label} is already ${table.status}`);
  }
  const order = insertOrder(restaurantId, { table_id, order_type });
  if (table_id) setTableStatus(table_id, 'occupied', order.id);
  return getOrderWithItems(order.id, restaurantId);
});

export const addOrderItem = db.transaction((businessType, restaurantId, orderId, { product_id, quantity = 1, notes }) => {
  requireOpenOrder(orderId, restaurantId);
  const product = getProduct(businessType, product_id, restaurantId);
  if (!product) throw new HttpError(404, 'Product not found');

  const existing = findOrderItemByProduct(orderId, product_id);
  if (existing) {
    updateOrderItem(existing.id, { quantity: existing.quantity + quantity, notes: notes ?? existing.notes });
  } else {
    insertOrderItem(orderId, {
      product_id,
      item_name_snapshot: product.name,
      unit_price: product.price,
      tax_percent: product.tax_percent,
      quantity,
      notes,
    });
  }
  recalcAndPersistTotals(orderId);
  return getOrderWithItems(orderId, restaurantId);
});

export const updateOrderItemQuantity = db.transaction((restaurantId, orderId, itemId, { quantity, notes }) => {
  requireOpenOrder(orderId, restaurantId);
  if (quantity !== undefined && quantity <= 0) {
    deleteOrderItem(itemId);
  } else {
    const updated = updateOrderItem(itemId, { quantity, notes });
    if (!updated) throw new HttpError(404, 'Order item not found');
  }
  recalcAndPersistTotals(orderId);
  return getOrderWithItems(orderId, restaurantId);
});

export const removeOrderItem = db.transaction((restaurantId, orderId, itemId) => {
  requireOpenOrder(orderId, restaurantId);
  const deleted = deleteOrderItem(itemId);
  if (!deleted) throw new HttpError(404, 'Order item not found');
  recalcAndPersistTotals(orderId);
  return getOrderWithItems(orderId, restaurantId);
});

export const billOrder = db.transaction((restaurantId, orderId) => {
  const order = requireOpenOrder(orderId, restaurantId);
  const items = getOrderItems(orderId);
  if (items.length === 0) throw new HttpError(400, 'Cannot bill an order with no items');
  const totals = computeTotals(items);
  updateOrderTotals(orderId, totals);
  transitionOrder(orderId, { status: 'billed', billed_at: new Date().toISOString() });
  if (order.table_id) setTableStatus(order.table_id, 'billed', orderId);
  return getOrderWithItems(orderId, restaurantId);
});

export const payOrder = db.transaction((restaurantId, orderId, { payment_method }) => {
  const order = getOrderRow(orderId, restaurantId);
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status !== 'billed') throw new HttpError(400, `Order must be billed before it can be paid (currently ${order.status})`);
  if (!['cash', 'card', 'upi'].includes(payment_method)) throw new HttpError(400, 'payment_method must be cash, card, or upi');

  transitionOrder(orderId, { status: 'paid', payment_method, paid_at: new Date().toISOString() });
  if (order.table_id) setTableStatus(order.table_id, 'available', null);
  return getOrderWithItems(orderId, restaurantId);
});

export const cancelOrder = db.transaction((restaurantId, orderId) => {
  const order = getOrderRow(orderId, restaurantId);
  if (!order) throw new HttpError(404, 'Order not found');
  if (!['open', 'billed'].includes(order.status)) throw new HttpError(400, `Order is already ${order.status}`);

  transitionOrder(orderId, { status: 'cancelled', cancelled_at: new Date().toISOString() });
  if (order.table_id) setTableStatus(order.table_id, 'available', null);
  return getOrderWithItems(orderId, restaurantId);
});
