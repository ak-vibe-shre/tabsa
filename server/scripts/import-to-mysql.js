// One-off data copy: local better-sqlite3 file -> MySQL (via Prisma).
// Run manually: node server/scripts/import-to-mysql.js
// Safe to re-run against an empty target (uses explicit source ids); do not
// run against a MySQL database that already has real data in these tables.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import prisma from '../src/db/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(__dirname, '..', 'data', 'restaurant.db');
const source = new Database(sourcePath, { readonly: true });

function toDate(value) {
  if (!value) return null;
  return new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
}

function toBool(value) {
  return value === 1 || value === true;
}

function parseJsonOr(value, fallback) {
  if (value == null) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function importRestaurants() {
  const rows = source.prepare('SELECT * FROM restaurants').all();
  for (const r of rows) {
    await prisma.restaurant.create({
      data: {
        id: r.id,
        name: r.name,
        address: r.address,
        phone: r.phone,
        enabled_modules: parseJsonOr(r.enabled_modules, []),
        subscription_plan: r.subscription_plan,
        status: r.status,
        business_type: r.business_type,
        created_at: toDate(r.created_at),
        updated_at: toDate(r.updated_at),
      },
    });
  }
  return rows.length;
}

async function importUsers() {
  const rows = source.prepare('SELECT * FROM users').all();
  for (const u of rows) {
    await prisma.user.create({
      data: {
        id: u.id,
        restaurant_id: u.restaurant_id,
        username: u.username,
        password_hash: u.password_hash,
        role: u.role,
        nav_visibility: u.nav_visibility != null ? parseJsonOr(u.nav_visibility, null) : null,
        created_at: toDate(u.created_at),
      },
    });
  }
  return rows.length;
}

async function importCategories() {
  const rows = source.prepare('SELECT * FROM categories').all();
  for (const c of rows) {
    await prisma.category.create({
      data: {
        id: c.id,
        restaurant_id: c.restaurant_id,
        name: c.name,
        sort_order: c.sort_order,
        created_at: toDate(c.created_at),
        updated_at: toDate(c.updated_at),
      },
    });
  }
  return rows.length;
}

async function importDiningTables() {
  const rows = source.prepare('SELECT * FROM dining_tables').all();
  for (const t of rows) {
    await prisma.diningTable.create({
      data: {
        id: t.id,
        restaurant_id: t.restaurant_id,
        label: t.label,
        seats: t.seats,
        status: t.status,
        current_order_id: t.current_order_id,
        lock_note: t.lock_note,
        created_at: toDate(t.created_at),
        updated_at: toDate(t.updated_at),
      },
    });
  }
  return rows.length;
}

async function importProducts(sourceTable, delegate) {
  const rows = source.prepare(`SELECT * FROM ${sourceTable}`).all();
  for (const p of rows) {
    const data = {
      id: p.id,
      restaurant_id: p.restaurant_id,
      category_id: p.category_id,
      name: p.name,
      description: p.description,
      price: p.price,
      tax_percent: p.tax_percent,
      is_available: toBool(p.is_available),
      image_url: p.image_url,
      created_at: toDate(p.created_at),
      updated_at: toDate(p.updated_at),
    };
    if ('food_type' in p) data.food_type = p.food_type;
    if ('age_range' in p) data.age_range = p.age_range;
    if ('safety_certified' in p) data.safety_certified = toBool(p.safety_certified);
    if ('serial_number' in p) data.serial_number = p.serial_number;
    if ('warranty_months' in p) data.warranty_months = p.warranty_months;
    if ('brand' in p) data.brand = p.brand;
    await delegate.create({ data });
  }
  return rows.length;
}

async function importOrders() {
  const rows = source.prepare('SELECT * FROM orders').all();
  for (const o of rows) {
    await prisma.order.create({
      data: {
        id: o.id,
        restaurant_id: o.restaurant_id,
        table_id: o.table_id,
        order_type: o.order_type,
        status: o.status,
        subtotal: o.subtotal,
        tax_total: o.tax_total,
        grand_total: o.grand_total,
        payment_method: o.payment_method,
        billed_at: toDate(o.billed_at),
        paid_at: toDate(o.paid_at),
        cancelled_at: toDate(o.cancelled_at),
        created_at: toDate(o.created_at),
        updated_at: toDate(o.updated_at),
      },
    });
  }
  return rows.length;
}

async function importOrderItems() {
  const rows = source.prepare('SELECT * FROM order_items').all();
  for (const i of rows) {
    await prisma.orderItem.create({
      data: {
        id: i.id,
        order_id: i.order_id,
        product_id: i.product_id,
        item_name_snapshot: i.item_name_snapshot,
        unit_price: i.unit_price,
        tax_percent: i.tax_percent,
        quantity: i.quantity,
        notes: i.notes,
        created_at: toDate(i.created_at),
        updated_at: toDate(i.updated_at),
      },
    });
  }
  return rows.length;
}

async function importInventoryItems() {
  const rows = source.prepare('SELECT * FROM inventory_items').all();
  for (const item of rows) {
    await prisma.inventoryItem.create({
      data: {
        id: item.id,
        restaurant_id: item.restaurant_id,
        name: item.name,
        unit: item.unit,
        current_stock: item.current_stock,
        low_stock_threshold: item.low_stock_threshold,
        created_at: toDate(item.created_at),
        updated_at: toDate(item.updated_at),
      },
    });
  }
  return rows.length;
}

async function importStockTransactions() {
  const rows = source.prepare('SELECT * FROM stock_transactions').all();
  for (const t of rows) {
    await prisma.stockTransaction.create({
      data: {
        id: t.id,
        inventory_item_id: t.inventory_item_id,
        type: t.type,
        quantity: t.quantity,
        note: t.note,
        created_at: toDate(t.created_at),
      },
    });
  }
  return rows.length;
}

async function importSettings() {
  const rows = source.prepare('SELECT * FROM settings').all();
  for (const s of rows) {
    await prisma.setting.create({ data: { key: s.key, value: s.value } });
  }
  return rows.length;
}

async function main() {
  const counts = {};
  counts.restaurants = await importRestaurants();
  counts.users = await importUsers();
  counts.categories = await importCategories();
  counts.dining_tables = await importDiningTables();
  counts.products_restaurant = await importProducts('products_restaurant', prisma.productRestaurant);
  counts.products_toy_store = await importProducts('products_toy_store', prisma.productToyStore);
  counts.products_electronics = await importProducts('products_electronics', prisma.productElectronics);
  counts.products_general_retail = await importProducts('products_general_retail', prisma.productGeneralRetail);
  counts.orders = await importOrders();
  counts.order_items = await importOrderItems();
  counts.inventory_items = await importInventoryItems();
  counts.stock_transactions = await importStockTransactions();
  counts.settings = await importSettings();

  console.log('Import complete. Row counts:');
  console.table(counts);
  console.log('(sessions were intentionally skipped — everyone logs in again)');
}

main()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    source.close();
    await prisma.$disconnect();
  });
