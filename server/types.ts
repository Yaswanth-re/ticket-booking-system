export type Gender = 'Female' | 'Male' | 'Other';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: number;
  fullName: string;
  email: string;
}

export interface Ticket {
  id: number;
  operator: string;
  serviceCode: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  price: number;
  vehicle: string;
  availableSeats: number;
}

export interface Seat {
  id: number;
  number: string;
  row: number;
  column: number;
  status: 'AVAILABLE' | 'BOOKED';
}

export interface PassengerInput {
  fullName: string;
  age: number;
  gender: Gender;
}

export interface CreateBookingInput {
  ticketId: number;
  travelDate: string;
  seats: string[];
  passengers: PassengerInput[];
}

export interface BookingDetail {
  id: number;
  bookingCode: string;
  status: BookingStatus;
  travelDate: string;
  totalAmount: number;
  createdAt: string;
  ticket: Ticket;
  seats: string[];
  passengers: Array<PassengerInput & { seatNumber: string }>;
}
