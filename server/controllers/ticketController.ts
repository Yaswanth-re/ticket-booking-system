import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors.js';
import { findTicket, getSeatLayout, searchTickets } from '../repositories/ticketRepository.js';
import { assertTravelDate } from '../services/bookingService.js';

function readId(value: string | string[]) {
  if (Array.isArray(value)) throw new AppError('Invalid service ID.');
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AppError('Invalid service ID.');
  return id;
}

function readDate(value: unknown) {
  if (typeof value !== 'string') throw new AppError('Travel date is required.');
  assertTravelDate(value);
  return value;
}

export function search(req: Request, res: Response, next: NextFunction) {
  try {
    const { source, destination } = req.query;
    if (typeof source !== 'string' || typeof destination !== 'string' || !source.trim() || !destination.trim()) {
      throw new AppError('Source and destination are required.');
    }
    if (source.trim().toLowerCase() === destination.trim().toLowerCase()) throw new AppError('Source and destination must be different.');
    const travelDate = readDate(req.query.date);
    res.json({ tickets: searchTickets(source, destination, travelDate) });
  } catch (error) { next(error); }
}

export function getTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = findTicket(readId(req.params.id), readDate(req.query.date));
    if (!ticket) throw new AppError('Service not found.', 404);
    res.json({ ticket });
  } catch (error) { next(error); }
}

export function getSeats(req: Request, res: Response, next: NextFunction) {
  try {
    const ticketId = readId(req.params.id);
    const travelDate = readDate(req.query.date);
    if (!findTicket(ticketId, travelDate)) throw new AppError('Service not found.', 404);
    res.json({ seats: getSeatLayout(ticketId, travelDate) });
  } catch (error) { next(error); }
}
