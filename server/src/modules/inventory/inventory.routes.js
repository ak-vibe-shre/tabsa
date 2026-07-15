import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import {
  listInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  listTransactions,
  addTransaction,
} from './inventory.repository.js';

export const inventoryRouter = Router();

inventoryRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    res.json(await listInventory(req.user.restaurantId, { lowStock: req.query.low_stock === 'true' }));
  })
);

inventoryRouter.post(
  '/',
  asyncRoute(async (req, res) => {
    const { name, unit } = req.body;
    if (!name || !unit) throw new HttpError(400, 'name and unit are required');
    res.status(201).json(await createInventoryItem(req.user.restaurantId, req.body));
  })
);

inventoryRouter.patch(
  '/:id',
  asyncRoute(async (req, res) => {
    const updated = await updateInventoryItem(Number(req.params.id), req.user.restaurantId, req.body);
    if (!updated) throw new HttpError(404, 'Inventory item not found');
    res.json(updated);
  })
);

inventoryRouter.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const deleted = await deleteInventoryItem(Number(req.params.id), req.user.restaurantId);
    if (!deleted) throw new HttpError(404, 'Inventory item not found');
    res.status(204).end();
  })
);

inventoryRouter.get(
  '/:id/transactions',
  asyncRoute(async (req, res) => {
    const item = await getInventoryItem(Number(req.params.id), req.user.restaurantId);
    if (!item) throw new HttpError(404, 'Inventory item not found');
    res.json(await listTransactions(Number(req.params.id)));
  })
);

inventoryRouter.post(
  '/:id/transactions',
  asyncRoute(async (req, res) => {
    const { type, quantity, note } = req.body;
    if (!['stock_in', 'stock_out', 'adjustment'].includes(type)) {
      throw new HttpError(400, 'type must be stock_in, stock_out, or adjustment');
    }
    if (typeof quantity !== 'number' || quantity < 0) {
      throw new HttpError(400, 'quantity must be a non-negative number');
    }
    try {
      const updated = await addTransaction(Number(req.params.id), req.user.restaurantId, { type, quantity, note });
      res.status(201).json(updated);
    } catch (err) {
      if (err.message === 'Inventory item not found') throw new HttpError(404, err.message);
      throw new HttpError(400, err.message);
    }
  })
);
