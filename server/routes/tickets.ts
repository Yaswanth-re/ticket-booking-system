import { Router } from 'express';
import { getSeats, getTicket, search } from '../controllers/ticketController.js';

export const ticketsRouter = Router();
ticketsRouter.get('/', search);
ticketsRouter.get('/:id', getTicket);
ticketsRouter.get('/:id/seats', getSeats);
