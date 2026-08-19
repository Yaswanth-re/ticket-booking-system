import { db } from '../db/index.js';
import type { BookingDetail, PassengerInput, Ticket } from '../types.js';

interface BookingRow {
  id: number;
  booking_code: string;
  status: 'CONFIRMED' | 'CANCELLED';
  travel_date: string;
  total_amount: number;
  created_at: string;
  service_id: number;
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

const bookingSelect = `
  SELECT b.id, b.booking_code, b.status, b.travel_date, b.total_amount, b.created_at, s.id AS service_id,
    s.operator, s.service_code, s.source, s.destination, s.departure_time, s.arrival_time,
    s.duration_minutes, s.price, s.vehicle
  FROM bookings b JOIN services s ON s.id = b.service_id
`;

function toBookingDetail(row: BookingRow): BookingDetail {
  const passengers = db.prepare(`
    SELECT p.full_name, p.age, p.gender, s.seat_number
    FROM passengers p
    JOIN booking_seats bs ON bs.passenger_id = p.id
    JOIN seats s ON s.id = bs.seat_id
    WHERE p.booking_id = ? ORDER BY s.row_number, s.column_number
  `).all(row.id) as Array<{ full_name: string; age: number; gender: PassengerInput['gender']; seat_number: string }>;

  const ticket: Ticket = {
    id: row.service_id,
    operator: row.operator,
    serviceCode: row.service_code,
    source: row.source,
    destination: row.destination,
    departureTime: row.departure_time,
    arrivalTime: row.arrival_time,
    durationMinutes: row.duration_minutes,
    price: row.price,
    vehicle: row.vehicle,
    availableSeats: 0,
  };
  return {
    id: row.id,
    bookingCode: row.booking_code,
    status: row.status,
    travelDate: row.travel_date,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
    ticket,
    seats: passengers.map((passenger) => passenger.seat_number),
    passengers: passengers.map((passenger) => ({
      fullName: passenger.full_name,
      age: passenger.age,
      gender: passenger.gender,
      seatNumber: passenger.seat_number,
    })),
  };
}

export function getBookingByCode(bookingCode: string, userId: number): BookingDetail | undefined {
  const row = db.prepare(`${bookingSelect} WHERE b.booking_code = ? AND b.user_id = ?`).get(bookingCode, userId) as BookingRow | undefined;
  return row ? toBookingDetail(row) : undefined;
}

export function listBookings(userId: number): BookingDetail[] {
  const rows = db.prepare(`${bookingSelect} WHERE b.user_id = ? ORDER BY b.created_at DESC, b.id DESC`).all(userId) as BookingRow[];
  return rows.map(toBookingDetail);
}

export function getOccupiedSeatNumbers(ticketId: number, travelDate: string): string[] {
  return (db.prepare(`
    SELECT s.seat_number FROM booking_seats bs
    JOIN bookings b ON b.id = bs.booking_id
    JOIN seats s ON s.id = bs.seat_id
    WHERE b.service_id = ? AND b.travel_date = ? AND b.status = 'CONFIRMED'
  `).all(ticketId, travelDate) as Array<{ seat_number: string }>).map((row) => row.seat_number);
}

export function insertBooking(
  bookingCode: string,
  userId: number,
  ticket: Ticket,
  travelDate: string,
  seats: Array<{ id: number; seat_number: string }>,
  passengers: PassengerInput[],
) {
  const booking = db.prepare(`
    INSERT INTO bookings (booking_code, user_id, service_id, travel_date, total_amount) VALUES (?, ?, ?, ?, ?)
  `).run(bookingCode, userId, ticket.id, travelDate, ticket.price * seats.length);
  const bookingId = Number(booking.lastInsertRowid);
  const insertPassenger = db.prepare('INSERT INTO passengers (booking_id, full_name, age, gender) VALUES (?, ?, ?, ?)');
  const assignSeat = db.prepare('INSERT INTO booking_seats (booking_id, seat_id, passenger_id) VALUES (?, ?, ?)');

  passengers.forEach((passenger, index) => {
    const passengerResult = insertPassenger.run(bookingId, passenger.fullName.trim(), passenger.age, passenger.gender);
    assignSeat.run(bookingId, seats[index].id, Number(passengerResult.lastInsertRowid));
  });
  return bookingId;
}

export function cancelBooking(bookingCode: string, userId: number) {
  return db.prepare(`UPDATE bookings SET status = 'CANCELLED' WHERE booking_code = ? AND user_id = ? AND status = 'CONFIRMED'`).run(bookingCode, userId);
}
