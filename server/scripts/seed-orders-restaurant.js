// One-off: bulk-generate random historical paid orders for one restaurant.
// Usage: node server/scripts/seed-orders-restaurant.js [restaurantId] [count]
import prisma from '../src/db/prisma.js';
import { delegateForTable } from '../src/db/productDelegates.js';
import { getBusinessType } from '../src/lib/businessTypes.js';

const restaurantId = Number(process.argv[2] ?? 1);
const count = Number(process.argv[3] ?? 5000);
const DAYS_BACK = 180;
const PAYMENT_METHODS = ['cash', 'card', 'upi'];
const ORDER_TYPES = ['dine_in', 'takeaway'];

function round2(n) {
  return Math.round(n * 100) / 100;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTimestampWithinDays(days) {
  const now = Date.now();
  const past = now - days * 24 * 60 * 60 * 1000;
  const t = past + Math.random() * (now - past);
  const d = new Date(t);
  d.setHours(11 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function main() {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new Error(`Restaurant ${restaurantId} not found`);

  const { table: productTable } = getBusinessType(restaurant.business_type);
  const delegate = delegateForTable(productTable);

  const [products, tables] = await Promise.all([
    delegate.findMany({ where: { restaurant_id: restaurantId }, select: { id: true, name: true, price: true, tax_percent: true } }),
    prisma.diningTable.findMany({ where: { restaurant_id: restaurantId }, select: { id: true } }),
  ]);

  if (products.length === 0) throw new Error(`Restaurant ${restaurantId} has no products to order`);

  const maxOrder = await prisma.order.aggregate({ _max: { id: true } });
  const maxOrderItem = await prisma.orderItem.aggregate({ _max: { id: true } });
  let nextOrderId = (maxOrder._max.id ?? 0) + 1;
  let nextItemId = (maxOrderItem._max.id ?? 0) + 1;

  const orders = [];
  const items = [];

  for (let i = 0; i < count; i++) {
    const orderId = nextOrderId++;
    const orderType = pick(ORDER_TYPES);
    const tableId = orderType === 'dine_in' && tables.length > 0 ? pick(tables).id : null;
    const timestamp = randomTimestampWithinDays(DAYS_BACK);

    const itemCount = 1 + Math.floor(Math.random() * 4);
    const chosen = [];
    for (let j = 0; j < itemCount; j++) {
      const product = pick(products);
      const quantity = 1 + Math.floor(Math.random() * 3);
      chosen.push({ product, quantity });
    }

    let subtotal = 0;
    let taxTotal = 0;
    for (const { product, quantity } of chosen) {
      const lineSubtotal = product.price * quantity;
      const lineTax = round2((lineSubtotal * product.tax_percent) / 100);
      subtotal += lineSubtotal;
      taxTotal += lineTax;
    }
    subtotal = round2(subtotal);
    taxTotal = round2(taxTotal);
    const grandTotal = round2(subtotal + taxTotal);

    orders.push({
      id: orderId,
      restaurant_id: restaurantId,
      table_id: tableId,
      order_type: orderType,
      status: 'paid',
      subtotal,
      tax_total: taxTotal,
      grand_total: grandTotal,
      payment_method: pick(PAYMENT_METHODS),
      billed_at: timestamp,
      paid_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
    });

    for (const { product, quantity } of chosen) {
      items.push({
        id: nextItemId++,
        order_id: orderId,
        product_id: product.id,
        item_name_snapshot: product.name,
        unit_price: product.price,
        tax_percent: product.tax_percent,
        quantity,
        created_at: timestamp,
        updated_at: timestamp,
      });
    }
  }

  const ORDER_BATCH = 1000;
  for (let i = 0; i < orders.length; i += ORDER_BATCH) {
    await prisma.order.createMany({ data: orders.slice(i, i + ORDER_BATCH) });
  }
  const ITEM_BATCH = 1000;
  for (let i = 0; i < items.length; i += ITEM_BATCH) {
    await prisma.orderItem.createMany({ data: items.slice(i, i + ITEM_BATCH) });
  }

  console.log(`Inserted ${orders.length} orders and ${items.length} order items for restaurant ${restaurantId} (${restaurant.name}).`);
}

main()
  .catch((err) => {
    console.error('Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
