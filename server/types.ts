export type Gender = 'Female' | 'Male' | 'Other';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED';
export type PaymentMethod = 'UPI' | 'CARD' | 'WALLET';
export type PaymentStatus = 'PAID';

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
  rating: number;
  amenities: string[];
  boardingPoints: string[];
  droppingPoints: string[];
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
  payment: PaymentInput;
}

export interface PaymentInput {
  method: PaymentMethod;
  reference: string;
}

export interface Payment {
  id: number;
  paymentCode: string;
  bookingCode: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceLabel: string;
  paidAt: string;
  ticket?: Pick<Ticket, 'operator' | 'source' | 'destination'>;
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
  payment?: Payment;
}
