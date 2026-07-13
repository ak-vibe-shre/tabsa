import './migrate.js';
import db from './client.js';

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

function seed() {
  db.exec(
    'DELETE FROM stock_transactions; DELETE FROM inventory_items; DELETE FROM order_items; DELETE FROM orders; DELETE FROM dining_tables; DELETE FROM menu_items; DELETE FROM categories; DELETE FROM settings;'
  );

  const insertCategory = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
  const insertMenuItem = db.prepare(
    'INSERT INTO menu_items (category_id, name, price, tax_percent, food_type) VALUES (?, ?, ?, ?, ?)'
  );
  const insertTable = db.prepare('INSERT INTO dining_tables (label, seats) VALUES (?, ?)');
  const insertInventory = db.prepare(
    'INSERT INTO inventory_items (name, unit, current_stock, low_stock_threshold) VALUES (?, ?, ?, ?)'
  );
  const insertStockTx = db.prepare(
    'INSERT INTO stock_transactions (inventory_item_id, type, quantity, note, created_at) VALUES (?, ?, ?, ?, ?)'
  );

  const categoryIds = {};
  for (const c of categories) {
    const { lastInsertRowid } = insertCategory.run(c.name, c.sort_order);
    categoryIds[c.name] = lastInsertRowid;
  }

  const allMenuItems = [];
  for (const [categoryName, items] of Object.entries(menuItemsByCategory)) {
    for (const item of items) {
      const { lastInsertRowid } = insertMenuItem.run(
        categoryIds[categoryName],
        item.name,
        item.price,
        item.tax_percent,
        item.food_type
      );
      allMenuItems.push({ id: lastInsertRowid, ...item });
    }
  }

  const tableIds = {};
  for (const t of tables) {
    const { lastInsertRowid } = insertTable.run(t.label, t.seats);
    tableIds[t.label] = lastInsertRowid;
  }

  db.prepare("UPDATE dining_tables SET status = 'locked', lock_note = ? WHERE id = ?").run(
    'Reserved for private event',
    tableIds['T8']
  );

  const insertSetting = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  insertSetting.run('restaurant_name', 'Tabsa');
  insertSetting.run('restaurant_address', '221B Residency Road, Bengaluru');
  insertSetting.run('restaurant_phone', '+91 98765 43210');
  insertSetting.run('enabled_modules', JSON.stringify(['inventory', 'dashboard']));
  insertSetting.run('subscription_plan', 'starter');

  const inventoryIds = [];
  for (const inv of inventoryItems) {
    const { lastInsertRowid } = insertInventory.run(inv.name, inv.unit, inv.current_stock, inv.low_stock_threshold);
    inventoryIds.push(lastInsertRowid);
    insertStockTx.run(
      lastInsertRowid,
      'stock_in',
      inv.current_stock,
      'Initial stock',
      new Date().toISOString()
    );
  }

  // Historical paid orders across the past 7 days so the dashboard has data on first run.
  const insertOrder = db.prepare(
    `INSERT INTO orders (order_type, status, subtotal, tax_total, grand_total, payment_method, billed_at, paid_at, created_at, updated_at)
     VALUES ('dine_in', 'paid', ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertOrderItem = db.prepare(
    `INSERT INTO order_items (order_id, menu_item_id, item_name_snapshot, unit_price, tax_percent, quantity)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

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
      const isoTime = orderTime.toISOString();
      const paymentMethod = paymentMethods[Math.floor(nextRandom() * paymentMethods.length)];

      const { lastInsertRowid: orderId } = insertOrder.run(
        subtotal,
        taxTotal,
        grandTotal,
        paymentMethod,
        isoTime,
        isoTime,
        isoTime,
        isoTime
      );

      for (const { item, quantity } of chosen) {
        insertOrderItem.run(orderId, item.id, item.name, item.price, item.tax_percent, quantity);
      }
    }
  }

  console.log('Seed complete: categories, menu items, tables, inventory, and 7 days of order history.');
}

seed();
