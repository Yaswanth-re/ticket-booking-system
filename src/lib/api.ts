import type { Booking, Passenger, Payment, PaymentMethod, Seat, Ticket, User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? 'Unable to complete this request.');
  return data as T;
}

export const api = {
  searchTickets: (source: string, destination: string, date: string) =>
    request<{ tickets: Ticket[] }>(`/tickets?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${date}`),
  getTicket: (id: number, date: string) => request<{ ticket: Ticket }>(`/tickets/${id}?date=${date}`),
  getSeats: (id: number, date: string) => request<{ seats: Seat[] }>(`/tickets/${id}/seats?date=${date}`),
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE}/auth/me`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message ?? 'Unable to restore your session.');
    return data.user as User | null;
  },
  signup: (input: { fullName: string; email: string; password: string }) =>
    request<{ user: User }>('/auth/signup', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  createBooking: (input: { ticketId: number; travelDate: string; seats: string[]; passengers: Passenger[]; payment: { method: PaymentMethod; reference: string } }) =>
    request<{ booking: Booking }>('/bookings', { method: 'POST', body: JSON.stringify(input) }),
  getBookings: () => request<{ bookings: Booking[] }>('/bookings'),
  cancelBooking: (code: string) => request<{ booking: Booking }>(`/bookings/${code}/cancel`, { method: 'PATCH' }),
  getPayments: () => request<{ payments: Payment[] }>('/payments'),
};
