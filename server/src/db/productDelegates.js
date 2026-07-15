import prisma from './prisma.js';

const MODEL_BY_TABLE = {
  products_restaurant: 'productRestaurant',
  products_toy_store: 'productToyStore',
  products_electronics: 'productElectronics',
  products_general_retail: 'productGeneralRetail',
};

// client defaults to the shared singleton but should be a $transaction's `tx`
// object when called from within a transaction, so the query joins that
// transaction instead of running on its own connection.
export function delegateForTable(table, client = prisma) {
  const modelName = MODEL_BY_TABLE[table];
  if (!modelName) throw new Error(`No Prisma delegate registered for table: ${table}`);
  return client[modelName];
}

export function allProductDelegates(client = prisma) {
  return Object.values(MODEL_BY_TABLE).map((name) => client[name]);
}
