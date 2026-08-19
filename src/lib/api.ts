import type { Booking, Passenger, Seat, Ticket } from '../types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
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
  createBooking: (input: { ticketId: number; travelDate: string; seats: string[]; passengers: Passenger[] }) =>
    request<{ booking: Booking }>('/bookings', { method: 'POST', body: JSON.stringify(input) }),
  getBookings: () => request<{ bookings: Booking[] }>('/bookings'),
  cancelBooking: (code: string) => request<{ booking: Booking }>(`/bookings/${code}/cancel`, { method: 'PATCH' }),
};
