import { Router } from 'express';
import { cancel, create, getOne, list } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth);
bookingsRouter.get('/', list);
bookingsRouter.post('/', create);
bookingsRouter.get('/:id', getOne);
bookingsRouter.patch('/:id/cancel', cancel);
