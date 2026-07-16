import prisma from '../../db/prisma.js';

export async function findTableByToken(token, client = prisma) {
  return client.diningTable.findUnique({
    where: { qr_token: token },
    include: { restaurant: true },
  });
}

export async function createTableOrderRequest(
  restaurantId,
  tableId,
  { product_id, item_name_snapshot, unit_price, tax_percent, quantity, notes },
  client = prisma
) {
  return client.tableOrderRequest.create({
    data: {
      restaurant_id: restaurantId,
      table_id: tableId,
      product_id,
      item_name_snapshot,
      unit_price,
      tax_percent,
      quantity,
      notes: notes ?? null,
    },
  });
}

// Recent requests for a table across all statuses — used by the customer
// page to poll and watch pending -> approved/rejected transitions.
export async function listRecentRequestsForTable(tableId, client = prisma) {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return client.tableOrderRequest.findMany({
    where: { table_id: tableId, created_at: { gte: since } },
    orderBy: { created_at: 'desc' },
  });
}

export async function listPendingRequestsForTable(tableId, restaurantId, client = prisma) {
  return client.tableOrderRequest.findMany({
    where: { table_id: tableId, restaurant_id: restaurantId, status: 'pending' },
    orderBy: { created_at: 'asc' },
  });
}

export async function getTableOrderRequest(id, tableId, restaurantId, client = prisma) {
  return client.tableOrderRequest.findFirst({
    where: { id, table_id: tableId, restaurant_id: restaurantId },
  });
}

export async function markRequestResolved(id, status, client = prisma) {
  return client.tableOrderRequest.update({
    where: { id },
    data: { status, resolved_at: new Date() },
  });
}
