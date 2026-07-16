import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { requireRestaurantRole } from '../../middleware/requireAuth.js';
import { listTables, createTable, updateTable, deleteTable, lockTable, releaseTable, getTableUsage, getTable } from './tables.repository.js';
import { listPendingRequestsForTable, getTableOrderRequest, markRequestResolved } from './tableRequests.repository.js';
import { createOrder, addOrderItem } from '../orders/orders.service.js';

export const tablesRouter = Router();
const requireManage = requireRestaurantRole('owner', 'manager');

tablesRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    res.json(await listTables(req.user.restaurantId));
  })
);

tablesRouter.get(
  '/usage',
  asyncRoute(async (req, res) => {
    res.json(await getTableUsage(req.user.restaurantId));
  })
);

tablesRouter.post(
  '/',
  requireManage,
  asyncRoute(async (req, res) => {
    const { label } = req.body;
    if (!label) throw new HttpError(400, 'label is required');
    try {
      res.status(201).json(await createTable(req.user.restaurantId, req.body));
    } catch (err) {
      throw new HttpError(409, err.message);
    }
  })
);

tablesRouter.patch(
  '/:id',
  requireManage,
  asyncRoute(async (req, res) => {
    const updated = await updateTable(Number(req.params.id), req.user.restaurantId, req.body);
    if (!updated) throw new HttpError(404, 'Table not found');
    res.json(updated);
  })
);

tablesRouter.delete(
  '/:id',
  requireManage,
  asyncRoute(async (req, res) => {
    const deleted = await deleteTable(Number(req.params.id), req.user.restaurantId);
    if (!deleted) throw new HttpError(404, 'Table not found');
    res.status(204).end();
  })
);

tablesRouter.post(
  '/:id/lock',
  asyncRoute(async (req, res) => {
    try {
      const table = await lockTable(Number(req.params.id), req.user.restaurantId, req.body?.note);
      if (!table) throw new HttpError(404, 'Table not found');
      res.json(table);
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw new HttpError(409, err.message);
    }
  })
);

tablesRouter.post(
  '/:id/release',
  asyncRoute(async (req, res) => {
    try {
      const table = await releaseTable(Number(req.params.id), req.user.restaurantId);
      if (!table) throw new HttpError(404, 'Table not found');
      res.json(table);
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw new HttpError(409, err.message);
    }
  })
);

tablesRouter.get(
  '/:id/requests',
  requireManage,
  asyncRoute(async (req, res) => {
    const table = await getTable(Number(req.params.id), req.user.restaurantId);
    if (!table) throw new HttpError(404, 'Table not found');
    res.json(await listPendingRequestsForTable(table.id, req.user.restaurantId));
  })
);

tablesRouter.post(
  '/:id/requests/:requestId/approve',
  requireManage,
  asyncRoute(async (req, res) => {
    const table = await getTable(Number(req.params.id), req.user.restaurantId);
    if (!table) throw new HttpError(404, 'Table not found');
    const request = await getTableOrderRequest(Number(req.params.requestId), table.id, req.user.restaurantId);
    if (!request || request.status !== 'pending') throw new HttpError(404, 'Request not found or already resolved');

    let orderId = table.current_order_id;
    if (!orderId) {
      const order = await createOrder(req.user.restaurantId, { table_id: table.id, order_type: 'dine_in' });
      orderId = order.id;
    }
    await addOrderItem(req.user.businessType, req.user.restaurantId, orderId, {
      product_id: request.product_id,
      quantity: request.quantity,
      notes: request.notes,
    });
    await markRequestResolved(request.id, 'approved');
    res.status(204).end();
  })
);

tablesRouter.post(
  '/:id/requests/:requestId/reject',
  requireManage,
  asyncRoute(async (req, res) => {
    const table = await getTable(Number(req.params.id), req.user.restaurantId);
    if (!table) throw new HttpError(404, 'Table not found');
    const request = await getTableOrderRequest(Number(req.params.requestId), table.id, req.user.restaurantId);
    if (!request || request.status !== 'pending') throw new HttpError(404, 'Request not found or already resolved');
    await markRequestResolved(request.id, 'rejected');
    res.status(204).end();
  })
);
