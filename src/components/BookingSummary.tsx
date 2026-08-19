import { formatDate, formatDuration, formatMoney } from '../lib/format';
import type { Booking, Passenger, SearchValues, Ticket } from '../types';

interface SummaryProps {
  ticket: Ticket;
  search: SearchValues;
  seats: string[];
  passengers: Passenger[];
}

export function JourneySummary({ ticket, search, seats, passengers }: SummaryProps) {
  return (
    <div className="journey-summary">
      <div className="journey-summary__top">
        <div>
          <span>{ticket.operator} · {ticket.serviceCode}</span>
          <strong>{ticket.vehicle}</strong>
        </div>
        <strong style={{ color: 'var(--primary)', fontSize: '20px' }}>
          {formatMoney(ticket.price * (seats.length || 1))}
        </strong>
      </div>
      <div className="journey-summary__route">
        <div>
          <strong>{ticket.departureTime}</strong>
          <span>{search.source}</span>
          <small style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {ticket.boardingPoints?.[0] || `${search.source} Bus Station`}
          </small>
        </div>
        <div style={{ textAlign: 'center', padding: '0 10px' }}>
          <span style={{ fontFamily: 'DM Mono', fontSize: '11px' }}>{formatDuration(ticket.durationMinutes)}</span>
          <i />
          <span style={{ fontSize: '10px' }}>Direct</span>
        </div>
        <div>
          <strong>{ticket.arrivalTime}</strong>
          <span>{search.destination}</span>
          <small style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {ticket.droppingPoints?.[0] || `${search.destination} Bus Stand`}
          </small>
        </div>
      </div>
      <div className="journey-summary__details">
        <span>{formatDate(search.date)}</span>
        <span>Seats: {seats.join(', ') || '—'}</span>
        <span>{passengers.length || search.passengers} traveller{ (passengers.length || search.passengers) === 1 ? '' : 's' }</span>
      </div>
    </div>
  );
}

export function BookingReceipt({ booking }: { booking: Booking }) {
  return (
    <div className="receipt">
      <div className="receipt__status">
        <div>
          <span>Booking reference</span>
          <strong>{booking.bookingCode}</strong>
        </div>
        <b className={`status status--${booking.status.toLowerCase()}`}>{booking.status}</b>
      </div>
      <JourneySummary
        ticket={booking.ticket}
        search={{
          source: booking.ticket.source,
          destination: booking.ticket.destination,
          date: booking.travelDate,
          passengers: booking.passengers.length,
        }}
        seats={booking.seats}
        passengers={booking.passengers}
      />
      
      {/* Passenger Details */}
      <div className="receipt__passengers">
        <strong>Passenger details</strong>
        {booking.passengers.map((passenger) => (
          <span key={passenger.seatNumber}>
            {passenger.fullName} ({passenger.age}, {passenger.gender})
            <b>Seat {passenger.seatNumber}</b>
          </span>
        ))}
      </div>
      
      {/* Payment details */}
      {booking.payment && (
        <div className="receipt__payment">
          <div>
            <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'DM Mono' }}>
              Payment recorded
            </span>
            <strong>{booking.payment.method} · {booking.payment.referenceLabel}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <b className="status status--paid" style={{ marginBottom: '4px' }}>PAID</b>
            <small style={{ display: 'block', color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>
              {booking.payment.paymentCode} · {formatMoney(booking.payment.amount)}
            </small>
          </div>
        </div>
      )}

      {/* Boarding pass barcode decoration */}
      <div className="receipt__barcode">
        <div className="barcode-lines" />
        <span className="barcode-text">{booking.bookingCode}</span>
      </div>
    </div>
  );
}
