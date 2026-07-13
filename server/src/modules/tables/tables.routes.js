import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { requireRestaurantRole } from '../../middleware/requireAuth.js';
import { listTables, createTable, updateTable, deleteTable, lockTable, releaseTable, getTableUsage } from './tables.repository.js';

export const tablesRouter = Router();
const requireManage = requireRestaurantRole('owner', 'manager');

tablesRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    res.json(listTables(req.user.restaurantId));
  })
);

tablesRouter.get(
  '/usage',
  asyncRoute(async (req, res) => {
    res.json(getTableUsage(req.user.restaurantId));
  })
);

tablesRouter.post(
  '/',
  requireManage,
  asyncRoute(async (req, res) => {
    const { label } = req.body;
    if (!label) throw new HttpError(400, 'label is required');
    try {
      res.status(201).json(createTable(req.user.restaurantId, req.body));
    } catch (err) {
      throw new HttpError(409, err.message);
    }
  })
);

tablesRouter.patch(
  '/:id',
  requireManage,
  asyncRoute(async (req, res) => {
    const updated = updateTable(Number(req.params.id), req.user.restaurantId, req.body);
    if (!updated) throw new HttpError(404, 'Table not found');
    res.json(updated);
  })
);

tablesRouter.delete(
  '/:id',
  requireManage,
  asyncRoute(async (req, res) => {
    const deleted = deleteTable(Number(req.params.id), req.user.restaurantId);
    if (!deleted) throw new HttpError(404, 'Table not found');
    res.status(204).end();
  })
);

tablesRouter.post(
  '/:id/lock',
  asyncRoute(async (req, res) => {
    try {
      const table = lockTable(Number(req.params.id), req.user.restaurantId, req.body?.note);
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
      const table = releaseTable(Number(req.params.id), req.user.restaurantId);
      if (!table) throw new HttpError(404, 'Table not found');
      res.json(table);
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw new HttpError(409, err.message);
    }
  })
);
