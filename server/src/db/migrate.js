import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import db from './client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function ensureColumn(table, column, definition) {
  const tableExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
  if (!tableExists) return;
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function ensureFirstRestaurant() {
  const existing = db.prepare('SELECT id FROM restaurants ORDER BY id LIMIT 1').get();
  if (existing) return existing.id;

  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settingsMap = {};
  for (const row of settingsRows) settingsMap[row.key] = row.value;

  const name = settingsMap.restaurant_name || 'Tabsa';
  const address = settingsMap.restaurant_address || null;
  const phone = settingsMap.restaurant_phone || null;
  const enabledModules = settingsMap.enabled_modules || '[]';
  const subscriptionPlan = settingsMap.subscription_plan || 'starter';

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO restaurants (name, address, phone, enabled_modules, subscription_plan)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(name, address, phone, enabledModules, subscriptionPlan);
  return lastInsertRowid;
}

function backfillRestaurantId(restaurantId) {
  const tables = ['categories', 'dining_tables', 'orders', 'inventory_items'];
  for (const table of tables) {
    ensureColumn(table, 'restaurant_id', 'INTEGER REFERENCES restaurants(id)');
    db.prepare(`UPDATE ${table} SET restaurant_id = ? WHERE restaurant_id IS NULL`).run(restaurantId);
  }
}

function migrateMenuItemsToProductsRestaurant(restaurantId) {
  const legacy = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'menu_items'").get();
  if (!legacy) return;

  ensureColumn('menu_items', 'restaurant_id', 'INTEGER REFERENCES restaurants(id)');
  db.prepare('UPDATE menu_items SET restaurant_id = ? WHERE restaurant_id IS NULL').run(restaurantId);

  db.pragma('foreign_keys = OFF');
  try {
    db.exec('DROP TABLE IF EXISTS products_restaurant');
    db.exec(`
      CREATE TABLE products_restaurant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        tax_percent REAL NOT NULL DEFAULT 5,
        food_type TEXT CHECK (food_type IS NULL OR food_type IN ('veg', 'non_veg', 'egg')),
        is_available INTEGER NOT NULL DEFAULT 1,
        image_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO products_restaurant
        (id, restaurant_id, category_id, name, description, price, tax_percent, food_type, is_available, image_url, created_at, updated_at)
        SELECT id, restaurant_id, category_id, name, description, price, tax_percent, food_type, is_available, image_url, created_at, updated_at
        FROM menu_items;
      DROP TABLE menu_items;
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_products_restaurant_category ON products_restaurant(category_id)');
  } finally {
    db.pragma('foreign_keys = ON');
  }
}

function migrateOrderItemsProductId() {
  const columns = db.prepare('PRAGMA table_info(order_items)').all();
  if (columns.some((c) => c.name === 'product_id')) return;
  if (!columns.some((c) => c.name === 'menu_item_id')) return;

  db.pragma('foreign_keys = OFF');
  try {
    db.exec(`
      CREATE TABLE order_items_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        item_name_snapshot TEXT NOT NULL,
        unit_price REAL NOT NULL,
        tax_percent REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO order_items_new
        (id, order_id, product_id, item_name_snapshot, unit_price, tax_percent, quantity, notes, created_at, updated_at)
        SELECT id, order_id, menu_item_id, item_name_snapshot, unit_price, tax_percent, quantity, notes, created_at, updated_at
        FROM order_items;
      DROP TABLE order_items;
      ALTER TABLE order_items_new RENAME TO order_items;
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)');
  } finally {
    db.pragma('foreign_keys = ON');
  }
}

function ensureDemoOwner(restaurantId) {
  const existing = db.prepare("SELECT id FROM users WHERE restaurant_id = ? AND role = 'owner'").get(restaurantId);
  if (existing) return;
  const passwordHash = bcrypt.hashSync('demo1234', 10);
  db.prepare("INSERT INTO users (restaurant_id, username, password_hash, role) VALUES (?, ?, ?, 'owner')").run(
    restaurantId,
    'demo',
    passwordHash
  );
}

function ensurePlatformAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE role = 'platform_admin'").get();
  if (existing) return;
  const passwordHash = bcrypt.hashSync('admin1234', 10);
  db.prepare("INSERT INTO users (restaurant_id, username, password_hash, role) VALUES (NULL, ?, ?, 'platform_admin')").run(
    'admin',
    passwordHash
  );
}

function ensureUserRoleConstraint() {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
  if (!row || row.sql.includes("'manager'")) return;

  db.pragma('foreign_keys = OFF');
  db.exec(`
    CREATE TABLE users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'staff', 'platform_admin')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO users_new (id, restaurant_id, username, password_hash, role, created_at)
      SELECT id, restaurant_id, username, password_hash, role, created_at FROM users;
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
  `);
  db.pragma('foreign_keys = ON');
}

const DEFAULT_PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price_label: '₹999/month',
    table_limit: 8,
    features: ['1 outlet', 'Up to 8 tables', 'Menu & Orders / Billing', 'Email support'],
    sort_order: 1,
  },
  {
    key: 'growth',
    name: 'Growth',
    price_label: '₹2,499/month',
    table_limit: 20,
    features: [
      'Everything in Starter',
      'Inventory management',
      'Dashboard & analytics',
      'Up to 20 tables',
      'Priority support',
    ],
    sort_order: 2,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price_label: 'Custom pricing',
    table_limit: null,
    features: ['Multi-outlet ready', 'Unlimited tables', 'Dedicated account manager', 'Custom integrations'],
    sort_order: 3,
  },
];

function ensurePlans() {
  const insert = db.prepare(
    `INSERT INTO plans (key, name, price_label, table_limit, features, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(key) DO NOTHING`
  );
  for (const plan of DEFAULT_PLANS) {
    insert.run(plan.key, plan.name, plan.price_label, plan.table_limit, JSON.stringify(plan.features), plan.sort_order);
  }
}

export function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);

  ensureColumn(
    'restaurants',
    'business_type',
    "TEXT NOT NULL DEFAULT 'restaurant' CHECK (business_type IN ('restaurant','toy_store','electronics_store','general_retail'))"
  );
  ensureColumn('restaurants', 'nav_visibility', 'TEXT');
  ensureUserRoleConstraint();

  const restaurantId = ensureFirstRestaurant();
  backfillRestaurantId(restaurantId);
  ensureColumn('menu_items', 'image_url', 'TEXT');
  migrateMenuItemsToProductsRestaurant(restaurantId);
  migrateOrderItemsProductId();
  // Safe only here: by this point order_items.product_id is guaranteed to exist,
  // either from a fresh schema.sql create or from the rebuild above.
  db.exec('CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)');

  ensureDemoOwner(restaurantId);
  ensurePlatformAdmin();
  ensurePlans();
}

migrate();
