import db from '../db/client.js';

export function getTableLimit(plan) {
  const row = db.prepare('SELECT table_limit FROM plans WHERE key = ?').get(plan);
  return row ? row.table_limit : null;
}
