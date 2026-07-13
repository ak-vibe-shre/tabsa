import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { listBusinessTypes } from '../../lib/businessTypes.js';

export const businessTypesRouter = Router();

businessTypesRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    res.json(listBusinessTypes());
  })
);
