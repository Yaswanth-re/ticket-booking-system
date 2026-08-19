import { randomBytes } from 'node:crypto';
import { db } from '../db/index.js';
import { AppError } from '../errors.js';
import { cancelBooking, getBookingByCode, getOccupiedSeatNumbers, insertBooking, listBookings } from '../repositories/bookingRepository.js';
import { findSeatIds, findTicket } from '../repositories/ticketRepository.js';
import type { BookingDetail, CreateBookingInput, PassengerInput } from '../types.js';

function assertTravelDate(travelDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(travelDate) || Number.isNaN(new Date(`${travelDate}T00:00:00`).getTime())) {
    throw new AppError('Choose a valid travel date.');
  }
  const today = new Date().toISOString().slice(0, 10);
  if (travelDate < today) throw new AppError('Travel date cannot be in the past.');
}

function validatePassengers(passengers: PassengerInput[]) {
  if (!Array.isArray(passengers) || passengers.length === 0 || passengers.length > 6) {
    throw new AppError('Bookings must include between 1 and 6 passengers.');
  }
  for (const passenger of passengers) {
    if (!passenger.fullName?.trim() || passenger.fullName.trim().length < 2) throw new AppError('Each passenger needs a full name.');
    if (!Number.isInteger(passenger.age) || passenger.age < 1 || passenger.age > 120) throw new AppError('Passenger age must be between 1 and 120.');
    if (!['Female', 'Male', 'Other'].includes(passenger.gender)) throw new AppError('Choose a valid gender for every passenger.');
  }
}

function generateBookingCode() {
  const year = new Date().getUTCFullYear();
  return `TF-${year}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export function createBooking(input: CreateBookingInput): BookingDetail {
  if (!Number.isInteger(input.ticketId) || input.ticketId < 1) throw new AppError('Choose a valid service.');
  assertTravelDate(input.travelDate);
  if (!Array.isArray(input.seats) || input.seats.length === 0) throw new AppError('Select at least one seat.');
  if (new Set(input.seats).size !== input.seats.length) throw new AppError('A seat can only be selected once.');
  validatePassengers(input.passengers);
  if (input.seats.length !== input.passengers.length) throw new AppError('Select one seat for each passenger.');

  const reserve = db.transaction(() => {
    const ticket = findTicket(input.ticketId, input.travelDate);
    if (!ticket) throw new AppError('This service is no longer available.', 404);

    const seats = findSeatIds(ticket.id, input.seats);
    if (seats.length !== input.seats.length) throw new AppError('One or more selected seats do not exist for this service.');

    const occupied = new Set(getOccupiedSeatNumbers(ticket.id, input.travelDate));
    const conflict = input.seats.find((seat) => occupied.has(seat));
    if (conflict) throw new AppError(`Seat ${conflict} was just booked. Please choose another seat.`, 409);

    const bookingCode = generateBookingCode();
    insertBooking(bookingCode, ticket, input.travelDate, seats, input.passengers);
    return getBookingByCode(bookingCode)!;
  });
  return reserve();
}

export function getBooking(bookingCode: string) {
  const booking = getBookingByCode(bookingCode);
  if (!booking) throw new AppError('Booking not found.', 404);
  return booking;
}

export function getAllBookings() {
  return listBookings();
}

export function cancelExistingBooking(bookingCode: string) {
  const booking = getBooking(bookingCode);
  if (booking.status === 'CANCELLED') throw new AppError('This booking has already been cancelled.', 409);
  const cancel = db.transaction(() => {
    const result = cancelBooking(bookingCode);
    if (result.changes !== 1) throw new AppError('This booking could not be cancelled.', 409);
    return getBooking(bookingCode);
  });
  return cancel();
}

export { assertTravelDate };
