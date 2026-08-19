import { formatDate, formatDuration, formatMoney } from '../lib/format';
import type { Booking, Passenger, SearchValues, Ticket } from '../types';

interface SummaryProps { ticket: Ticket; search: SearchValues; seats: string[]; passengers: Passenger[]; }

export function JourneySummary({ ticket, search, seats, passengers }: SummaryProps) {
  return <div className="journey-summary">
    <div className="journey-summary__top"><div><span>{ticket.operator} · {ticket.serviceCode}</span><strong>{ticket.vehicle}</strong></div><strong>{formatMoney(ticket.price * seats.length)}</strong></div>
    <div className="journey-summary__route"><div><strong>{ticket.departureTime}</strong><span>{search.source}</span></div><div><span>{formatDuration(ticket.durationMinutes)}</span><i /></div><div><strong>{ticket.arrivalTime}</strong><span>{search.destination}</span></div></div>
    <div className="journey-summary__details"><span>{formatDate(search.date)}</span><span>Seats: {seats.join(', ') || '—'}</span><span>{passengers.length} traveller{passengers.length === 1 ? '' : 's'}</span></div>
  </div>;
}

export function BookingReceipt({ booking }: { booking: Booking }) {
  return <div className="receipt">
    <div className="receipt__status"><span>Booking reference</span><strong>{booking.bookingCode}</strong><b className={`status status--${booking.status.toLowerCase()}`}>{booking.status}</b></div>
    <JourneySummary ticket={booking.ticket} search={{ source: booking.ticket.source, destination: booking.ticket.destination, date: booking.travelDate, passengers: booking.passengers.length }} seats={booking.seats} passengers={booking.passengers} />
    <div className="receipt__passengers"><strong>Passengers</strong>{booking.passengers.map((passenger) => <span key={passenger.seatNumber}>{passenger.fullName} · {passenger.age} · {passenger.gender} <b>Seat {passenger.seatNumber}</b></span>)}</div>
  </div>;
}
