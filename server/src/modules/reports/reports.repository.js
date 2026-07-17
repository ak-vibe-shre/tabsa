import prisma from '../../db/prisma.js';
import { getBusinessType } from '../../lib/businessTypes.js';
import { delegateForTable } from '../../db/productDelegates.js';

function normalizeRange({ from, to }) {
  const toDate = to || new Date().toISOString().slice(0, 10);
  const fromDate = from || new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { from: fromDate, to: toDate };
}

function dayRange(from, to) {
  const gte = new Date(`${from}T00:00:00.000Z`);
  const lt = new Date(`${to}T00:00:00.000Z`);
  lt.setUTCDate(lt.getUTCDate() + 1);
  return { gte, lt };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export async function getSummary(restaurantId, range) {
  const { from, to } = normalizeRange(range);
  const { gte, lt } = dayRange(from, to);
  const orders = await prisma.order.findMany({
    where: { restaurant_id: restaurantId, status: 'paid', paid_at: { gte, lt } },
    select: { grand_total: true },
  });
  const revenue = round2(orders.reduce((sum, o) => sum + o.grand_total, 0));
  const orders_count = orders.length;
  const avgOrderValue = orders_count > 0 ? revenue / orders_count : 0;
  return { from, to, revenue, orders_count, avg_order_value: round2(avgOrderValue) };
}

export async function getSalesTrend(restaurantId, range) {
  const { from, to } = normalizeRange(range);
  const { gte, lt } = dayRange(from, to);
  const orders = await prisma.order.findMany({
    where: { restaurant_id: restaurantId, status: 'paid', paid_at: { gte, lt } },
    select: { paid_at: true, grand_total: true },
  });
  const byDay = new Map();
  for (const o of orders) {
    const day = o.paid_at.toISOString().slice(0, 10);
    const entry = byDay.get(day) ?? { day, revenue: 0, orders_count: 0 };
    entry.revenue += o.grand_total;
    entry.orders_count += 1;
    byDay.set(day, entry);
  }
  return [...byDay.values()].map((e) => ({ ...e, revenue: round2(e.revenue) })).sort((a, b) => (a.day < b.day ? -1 : 1));
}

export async function getTopItems(restaurantId, range, limit = 10) {
  const { from, to } = normalizeRange(range);
  const { gte, lt } = dayRange(from, to);
  const items = await prisma.orderItem.findMany({
    where: { order: { restaurant_id: restaurantId, status: 'paid', paid_at: { gte, lt } } },
    select: { item_name_snapshot: true, quantity: true, unit_price: true },
  });
  const byName = new Map();
  for (const i of items) {
    const entry = byName.get(i.item_name_snapshot) ?? { name: i.item_name_snapshot, quantity: 0, revenue: 0 };
    entry.quantity += i.quantity;
    entry.revenue += i.unit_price * i.quantity;
    byName.set(i.item_name_snapshot, entry);
  }
  return [...byName.values()]
    .map((e) => ({ ...e, revenue: round2(e.revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getProfitLoss(businessType, restaurantId, range) {
  const { from, to } = normalizeRange(range);
  const { gte, lt } = dayRange(from, to);

  const orders = await prisma.order.findMany({
    where: { restaurant_id: restaurantId, status: 'paid', paid_at: { gte, lt } },
    select: { grand_total: true },
  });
  const revenue = round2(orders.reduce((sum, o) => sum + o.grand_total, 0));

  let cost;
  let cost_label;
  if (businessType === 'restaurant') {
    // No recipe/BOM system links a dish to the ingredients it consumes, so
    // per-order COGS isn't computable here — the honest number is cash spent
    // restocking inventory in this period, not a per-dish margin.
    cost_label = 'Inventory purchases';
    const stockIns = await prisma.stockTransaction.findMany({
      where: { type: 'stock_in', created_at: { gte, lt }, inventory_item: { restaurant_id: restaurantId } },
      select: { quantity: true, purchase_price: true },
    });
    cost = round2(stockIns.reduce((sum, t) => sum + (t.purchase_price ?? 0) * t.quantity, 0));
  } else {
    cost_label = 'Cost of goods sold';
    const items = await prisma.orderItem.findMany({
      where: { order: { restaurant_id: restaurantId, status: 'paid', paid_at: { gte, lt } } },
      select: { purchase_price_snapshot: true, quantity: true },
    });
    cost = round2(items.reduce((sum, i) => sum + (i.purchase_price_snapshot ?? 0) * i.quantity, 0));
  }

  return { from, to, revenue, cost, cost_label, gross_profit: round2(revenue - cost) };
}

export async function getCategoryRevenue(businessType, restaurantId, range) {
  const { table } = getBusinessType(businessType);
  const { from, to } = normalizeRange(range);
  const { gte, lt } = dayRange(from, to);

  const items = await prisma.orderItem.findMany({
    where: { order: { restaurant_id: restaurantId, status: 'paid', paid_at: { gte, lt } } },
    select: { product_id: true, unit_price: true, quantity: true },
  });
  if (items.length === 0) return [];

  const productIds = [...new Set(items.map((i) => i.product_id))];
  const delegate = delegateForTable(table);
  const products = await delegate.findMany({ where: { id: { in: productIds } }, select: { id: true, category_id: true } });
  const categoryIdByProduct = new Map(products.map((p) => [p.id, p.category_id]));

  const categoryIds = [...new Set(products.map((p) => p.category_id))];
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } });
  const nameByCategory = new Map(categories.map((c) => [c.id, c.name]));

  const byCategory = new Map();
  for (const item of items) {
    const categoryId = categoryIdByProduct.get(item.product_id);
    const name = categoryId != null ? nameByCategory.get(categoryId) ?? null : null;
    const revenue = (byCategory.get(name) ?? 0) + item.unit_price * item.quantity;
    byCategory.set(name, revenue);
  }

  return [...byCategory.entries()]
    .map(([category, revenue]) => ({ category, revenue: round2(revenue) }))
    .sort((a, b) => b.revenue - a.revenue);
}
