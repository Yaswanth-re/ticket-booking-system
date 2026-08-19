import type { NextFunction, Request, Response } from 'express';
import { getAllPayments } from '../services/paymentService.js';
import type { User } from '../types.js';

export function list(_request: Request, response: Response, next: NextFunction) {
  try { response.json({ payments: getAllPayments((response.locals.user as User).id) }); } catch (error) { next(error); }
}
