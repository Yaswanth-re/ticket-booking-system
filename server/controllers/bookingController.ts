import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors.js';
import { cancelExistingBooking, createBooking, getAllBookings, getBooking } from '../services/bookingService.js';

function bookingCode(value: string | string[]) {
  if (Array.isArray(value)) throw new AppError('Invalid booking ID.');
  return value;
}

export function create(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json({ booking: createBooking(req.body) }); } catch (error) { next(error); }
}

export function list(_req: Request, res: Response, next: NextFunction) {
  try { res.json({ bookings: getAllBookings() }); } catch (error) { next(error); }
}

export function getOne(req: Request, res: Response, next: NextFunction) {
  try { res.json({ booking: getBooking(bookingCode(req.params.id)) }); } catch (error) { next(error); }
}

export function cancel(req: Request, res: Response, next: NextFunction) {
  try { res.json({ booking: cancelExistingBooking(bookingCode(req.params.id)) }); } catch (error) { next(error); }
}
