import db from '../../db/client.js';

function hydrate(row) {
  if (!row) return null;
  return { ...row, features: JSON.parse(row.features || '[]') };
}

export function listPlans() {
  return db.prepare('SELECT * FROM plans ORDER BY sort_order ASC').all().map(hydrate);
}

export function getPlan(key) {
  return hydrate(db.prepare('SELECT * FROM plans WHERE key = ?').get(key));
}

export function updatePlan(key, { name, price_label, table_limit, features }) {
  const current = getPlan(key);
  if (!current) return null;
  db.prepare(
    `UPDATE plans SET name = ?, price_label = ?, table_limit = ?, features = ?, updated_at = datetime('now') WHERE key = ?`
  ).run(
    name ?? current.name,
    price_label ?? current.price_label,
    table_limit !== undefined ? table_limit : current.table_limit,
    features !== undefined ? JSON.stringify(features) : JSON.stringify(current.features),
    key
  );
  return getPlan(key);
}
