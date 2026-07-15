import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { listOrders, getOrderWithItems } from './orders.repository.js';
import {
  createOrder,
  addOrderItem,
  updateOrderItemQuantity,
  removeOrderItem,
  billOrder,
  payOrder,
  cancelOrder,
} from './orders.service.js';

export const ordersRouter = Router();

ordersRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    const { status, table_id, date, invoice_number, page, pageSize } = req.query;
    res.json(
      await listOrders(req.user.restaurantId, {
        status,
        table_id: table_id ? Number(table_id) : undefined,
        date,
        invoice_number,
        page,
        pageSize,
      })
    );
  })
);

ordersRouter.post(
  '/',
  asyncRoute(async (req, res) => {
    const { table_id, order_type } = req.body;
    res.status(201).json(await createOrder(req.user.restaurantId, { table_id, order_type }));
  })
);

ordersRouter.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const order = await getOrderWithItems(Number(req.params.id), req.user.restaurantId);
    if (!order) throw new HttpError(404, 'Order not found');
    res.json(order);
  })
);

ordersRouter.post(
  '/:id/items',
  asyncRoute(async (req, res) => {
    const { product_id, quantity, notes } = req.body;
    if (!product_id) throw new HttpError(400, 'product_id is required');
    res
      .status(201)
      .json(await addOrderItem(req.user.businessType, req.user.restaurantId, Number(req.params.id), { product_id, quantity, notes }));
  })
);

ordersRouter.patch(
  '/:id/items/:itemId',
  asyncRoute(async (req, res) => {
    res.json(await updateOrderItemQuantity(req.user.restaurantId, Number(req.params.id), Number(req.params.itemId), req.body));
  })
);

ordersRouter.delete(
  '/:id/items/:itemId',
  asyncRoute(async (req, res) => {
    res.json(await removeOrderItem(req.user.restaurantId, Number(req.params.id), Number(req.params.itemId)));
  })
);

ordersRouter.post(
  '/:id/bill',
  asyncRoute(async (req, res) => {
    res.json(await billOrder(req.user.restaurantId, Number(req.params.id)));
  })
);

ordersRouter.post(
  '/:id/pay',
  asyncRoute(async (req, res) => {
    res.json(await payOrder(req.user.restaurantId, Number(req.params.id), req.body));
  })
);

ordersRouter.post(
  '/:id/cancel',
  asyncRoute(async (req, res) => {
    res.json(await cancelOrder(req.user.restaurantId, Number(req.params.id)));
  })
);
