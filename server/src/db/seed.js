import './bootstrap.js';
import prisma from './prisma.js';

const categories = [
  { name: 'Starters', sort_order: 1 },
  { name: 'Main Course', sort_order: 2 },
  { name: 'Breads', sort_order: 3 },
  { name: 'Rice & Biryani', sort_order: 4 },
  { name: 'Beverages', sort_order: 5 },
  { name: 'Desserts', sort_order: 6 },
];

const menuItemsByCategory = {
  Starters: [
    { name: 'Paneer Tikka', price: 220, food_type: 'veg', tax_percent: 5 },
    { name: 'Chicken 65', price: 260, food_type: 'non_veg', tax_percent: 5 },
    { name: 'Veg Spring Rolls', price: 190, food_type: 'veg', tax_percent: 5 },
    { name: 'Chilli Garlic Prawns', price: 320, food_type: 'non_veg', tax_percent: 5 },
  ],
  'Main Course': [
    { name: 'Butter Chicken', price: 340, food_type: 'non_veg', tax_percent: 5 },
    { name: 'Paneer Butter Masala', price: 280, food_type: 'veg', tax_percent: 5 },
    { name: 'Dal Makhani', price: 220, food_type: 'veg', tax_percent: 5 },
    { name: 'Kadai Chicken', price: 320, food_type: 'non_veg', tax_percent: 5 },
    { name: 'Egg Curry', price: 210, food_type: 'egg', tax_percent: 5 },
    { name: 'Mixed Veg Curry', price: 200, food_type: 'veg', tax_percent: 5 },
  ],
  Breads: [
    { name: 'Butter Naan', price: 60, food_type: 'veg', tax_percent: 5 },
    { name: 'Tandoori Roti', price: 40, food_type: 'veg', tax_percent: 5 },
    { name: 'Garlic Naan', price: 75, food_type: 'veg', tax_percent: 5 },
    { name: 'Laccha Paratha', price: 65, food_type: 'veg', tax_percent: 5 },
  ],
  'Rice & Biryani': [
    { name: 'Chicken Biryani', price: 300, food_type: 'non_veg', tax_percent: 5 },
    { name: 'Veg Biryani', price: 240, food_type: 'veg', tax_percent: 5 },
    { name: 'Jeera Rice', price: 150, food_type: 'veg', tax_percent: 5 },
  ],
  Beverages: [
    { name: 'Masala Chai', price: 50, food_type: 'veg', tax_percent: 12 },
    { name: 'Fresh Lime Soda', price: 90, food_type: 'veg', tax_percent: 12 },
    { name: 'Mango Lassi', price: 120, food_type: 'veg', tax_percent: 12 },
    { name: 'Cold Coffee', price: 130, food_type: 'veg', tax_percent: 12 },
  ],
  Desserts: [
    { name: 'Gulab Jamun', price: 110, food_type: 'veg', tax_percent: 5 },
    { name: 'Rasmalai', price: 130, food_type: 'veg', tax_percent: 5 },
    { name: 'Gajar Halwa', price: 140, food_type: 'veg', tax_percent: 5 },
  ],
};

const tables = [
  { label: 'T1', seats: 2 },
  { label: 'T2', seats: 2 },
  { label: 'T3', seats: 4 },
  { label: 'T4', seats: 4 },
  { label: 'T5', seats: 4 },
  { label: 'T6', seats: 6 },
  { label: 'T7', seats: 6 },
  { label: 'T8', seats: 8 },
];

const inventoryItems = [
  { name: 'Basmati Rice', unit: 'kg', current_stock: 40, low_stock_threshold: 10 },
  { name: 'Chicken', unit: 'kg', current_stock: 8, low_stock_threshold: 10 },
  { name: 'Paneer', unit: 'kg', current_stock: 12, low_stock_threshold: 5 },
  { name: 'Tomatoes', unit: 'kg', current_stock: 3, low_stock_threshold: 8 },
  { name: 'Onions', unit: 'kg', current_stock: 25, low_stock_threshold: 10 },
  { name: 'Cooking Oil', unit: 'ltr', current_stock: 18, low_stock_threshold: 6 },
  { name: 'Milk', unit: 'ltr', current_stock: 15, low_stock_threshold: 8 },
  { name: 'Butter', unit: 'kg', current_stock: 4, low_stock_threshold: 5 },
  { name: 'Atta (Flour)', unit: 'kg', current_stock: 30, low_stock_threshold: 10 },
  { name: 'Spice Mix', unit: 'kg', current_stock: 6, low_stock_threshold: 3 },
];

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function ensureDemoRestaurant() {
  const existing = await prisma.restaurant.findFirst({ where: { name: 'Tabsa' } });
  if (existing) return existing;
  return prisma.restaurant.create({
    data: {
      name: 'Tabsa',
      address: '221B Residency Road, Bengaluru',
      phone: '+91 98765 43210',
      enabled_modules: ['inventory', 'dashboard'],
      subscription_plan: 'starter',
      business_type: 'restaurant',
    },
  });
}

async function clearDemoData(restaurantId) {
  await prisma.order.deleteMany({ where: { restaurant_id: restaurantId } }); // cascades order_items
  await prisma.category.deleteMany({ where: { restaurant_id: restaurantId } }); // cascades products_restaurant
  await prisma.diningTable.deleteMany({ where: { restaurant_id: restaurantId } });
  await prisma.inventoryItem.deleteMany({ where: { restaurant_id: restaurantId } }); // cascades stock_transactions
}

async function seed() {
  const restaurant = await ensureDemoRestaurant();
  await clearDemoData(restaurant.id);

  const categoryIds = {};
  for (const c of categories) {
    const created = await prisma.category.create({
      data: { restaurant_id: restaurant.id, name: c.name, sort_order: c.sort_order },
    });
    categoryIds[c.name] = created.id;
  }

  const allMenuItems = [];
  for (const [categoryName, items] of Object.entries(menuItemsByCategory)) {
    for (const item of items) {
      const created = await prisma.productRestaurant.create({
        data: {
          restaurant_id: restaurant.id,
          category_id: categoryIds[categoryName],
          name: item.name,
          price: item.price,
          tax_percent: item.tax_percent,
          food_type: item.food_type,
        },
      });
      allMenuItems.push({ id: created.id, ...item });
    }
  }

  const tableIds = {};
  for (const t of tables) {
    const created = await prisma.diningTable.create({
      data: { restaurant_id: restaurant.id, label: t.label, seats: t.seats },
    });
    tableIds[t.label] = created.id;
  }

  await prisma.diningTable.update({
    where: { id: tableIds['T8'] },
    data: { status: 'locked', lock_note: 'Reserved for private event' },
  });

  const inventoryIds = [];
  for (const inv of inventoryItems) {
    const created = await prisma.inventoryItem.create({
      data: {
        restaurant_id: restaurant.id,
        name: inv.name,
        unit: inv.unit,
        current_stock: inv.current_stock,
        low_stock_threshold: inv.low_stock_threshold,
      },
    });
    inventoryIds.push(created.id);
    await prisma.stockTransaction.create({
      data: { inventory_item_id: created.id, type: 'stock_in', quantity: inv.current_stock, note: 'Initial stock' },
    });
  }

  // Historical paid orders across the past 7 days so the dashboard has data on first run.
  const paymentMethods = ['cash', 'card', 'upi'];
  let seedValue = 42;
  function nextRandom() {
    // simple deterministic LCG so re-seeding produces stable-looking demo data
    seedValue = (seedValue * 1103515245 + 12345) % 2147483648;
    return seedValue / 2147483648;
  }

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const day = new Date();
    day.setDate(day.getDate() - dayOffset);
    const ordersToday = 4 + Math.floor(nextRandom() * 5); // 4-8 orders/day

    for (let i = 0; i < ordersToday; i++) {
      const itemCount = 1 + Math.floor(nextRandom() * 4);
      const chosen = [];
      for (let j = 0; j < itemCount; j++) {
        const item = allMenuItems[Math.floor(nextRandom() * allMenuItems.length)];
        const quantity = 1 + Math.floor(nextRandom() * 3);
        chosen.push({ item, quantity });
      }

      let subtotal = 0;
      let taxTotal = 0;
      for (const { item, quantity } of chosen) {
        const lineSubtotal = item.price * quantity;
        const lineTax = round2((lineSubtotal * item.tax_percent) / 100);
        subtotal += lineSubtotal;
        taxTotal += lineTax;
      }
      subtotal = round2(subtotal);
      taxTotal = round2(taxTotal);
      const grandTotal = round2(subtotal + taxTotal);

      const hour = 11 + Math.floor(nextRandom() * 10);
      const orderTime = new Date(day);
      orderTime.setHours(hour, Math.floor(nextRandom() * 60), 0, 0);
      const paymentMethod = paymentMethods[Math.floor(nextRandom() * paymentMethods.length)];

      const order = await prisma.order.create({
        data: {
          restaurant_id: restaurant.id,
          order_type: 'dine_in',
          status: 'paid',
          subtotal,
          tax_total: taxTotal,
          grand_total: grandTotal,
          payment_method: paymentMethod,
          billed_at: orderTime,
          paid_at: orderTime,
          created_at: orderTime,
          updated_at: orderTime,
        },
      });

      for (const { item, quantity } of chosen) {
        await prisma.orderItem.create({
          data: {
            order_id: order.id,
            product_id: item.id,
            item_name_snapshot: item.name,
            unit_price: item.price,
            tax_percent: item.tax_percent,
            quantity,
          },
        });
      }
    }
  }

  console.log('Seed complete: categories, menu items, tables, inventory, and 7 days of order history.');
}

await seed();
