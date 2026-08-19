export interface SearchValues {
  source: string;
  destination: string;
  date: string;
  passengers: number;
}

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

export interface Passenger {
  fullName: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
}

export type PaymentMethod = 'UPI' | 'CARD' | 'WALLET';

export interface Payment {
  id: number;
  paymentCode: string;
  bookingCode: string;
  amount: number;
  method: PaymentMethod;
  status: 'PAID';
  referenceLabel: string;
  paidAt: string;
  ticket?: Pick<Ticket, 'operator' | 'source' | 'destination'>;
}

export interface Booking {
  id: number;
  bookingCode: string;
  status: 'CONFIRMED' | 'CANCELLED';
  travelDate: string;
  totalAmount: number;
  createdAt: string;
  ticket: Ticket;
  seats: string[];
  passengers: Array<Passenger & { seatNumber: string }>;
  payment?: Payment;
}
