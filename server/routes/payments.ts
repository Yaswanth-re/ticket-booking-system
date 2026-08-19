import { Router } from 'express';
import { list } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/auth.js';

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);
paymentsRouter.get('/', list);
