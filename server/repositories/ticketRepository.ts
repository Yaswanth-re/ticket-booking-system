import { db } from '../db/index.js';
import type { Seat, Ticket } from '../types.js';

interface TicketRow {
  id: number;
  operator: string;
  service_code: string;
  source: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  price: number;
  vehicle: string;
}

const baseSelect = `
  SELECT id, operator, service_code, source, destination, departure_time, arrival_time, duration_minutes, price, vehicle
  FROM services WHERE active = 1
`;

function toTicket(row: TicketRow, availableSeats: number): Ticket {
  return {
    id: row.id,
    operator: row.operator,
    serviceCode: row.service_code,
    source: row.source,
    destination: row.destination,
    departureTime: row.departure_time,
    arrivalTime: row.arrival_time,
    durationMinutes: row.duration_minutes,
    price: row.price,
    vehicle: row.vehicle,
    availableSeats,
  };
}

export function getAvailableSeatsCount(ticketId: number, travelDate: string) {
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM seats s
    WHERE s.service_id = ? AND NOT EXISTS (
      SELECT 1 FROM booking_seats bs
      JOIN bookings b ON b.id = bs.booking_id
      WHERE bs.seat_id = s.id AND b.travel_date = ? AND b.status = 'CONFIRMED'
    )
  `).get(ticketId, travelDate) as { count: number };
  return row.count;
}

export function searchTickets(source: string, destination: string, travelDate: string): Ticket[] {
  const rows = db.prepare(`${baseSelect} AND lower(source) = lower(?) AND lower(destination) = lower(?) ORDER BY departure_time`)
    .all(source.trim(), destination.trim()) as TicketRow[];
  return rows.map((row) => toTicket(row, getAvailableSeatsCount(row.id, travelDate)));
}

export function findTicket(ticketId: number, travelDate: string): Ticket | undefined {
  const row = db.prepare(`${baseSelect} AND id = ?`).get(ticketId) as TicketRow | undefined;
  return row ? toTicket(row, getAvailableSeatsCount(row.id, travelDate)) : undefined;
}

export function getSeatLayout(ticketId: number, travelDate: string): Seat[] {
  const occupied = new Set((db.prepare(`
    SELECT bs.seat_id
    FROM booking_seats bs JOIN bookings b ON b.id = bs.booking_id
    WHERE b.service_id = ? AND b.travel_date = ? AND b.status = 'CONFIRMED'
  `).all(ticketId, travelDate) as Array<{ seat_id: number }>).map((row) => row.seat_id));

  return (db.prepare(`
    SELECT id, seat_number, row_number, column_number FROM seats WHERE service_id = ? ORDER BY row_number, column_number
  `).all(ticketId) as Array<{ id: number; seat_number: string; row_number: number; column_number: number }>).map((seat) => ({
    id: seat.id,
    number: seat.seat_number,
    row: seat.row_number,
    column: seat.column_number,
    status: occupied.has(seat.id) ? 'BOOKED' : 'AVAILABLE',
  }));
}

export function findSeatIds(ticketId: number, seatNumbers: string[]) {
  const placeholders = seatNumbers.map(() => '?').join(', ');
  return db.prepare(`SELECT id, seat_number FROM seats WHERE service_id = ? AND seat_number IN (${placeholders})`)
    .all(ticketId, ...seatNumbers) as Array<{ id: number; seat_number: string }>;
}
