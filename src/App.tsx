import { useState } from 'react';
import heroImage from './assets/ticketflow-hero.png';
import { BookingReceipt, JourneySummary } from './components/BookingSummary';
import { PassengerForm } from './components/PassengerForm';
import { SearchForm } from './components/SearchForm';
import { SeatGrid } from './components/SeatGrid';
import { TicketList } from './components/TicketList';
import { api } from './lib/api';
import { formatDate, formatMoney, today } from './lib/format';
import type { Booking, Passenger, SearchValues, Seat, Ticket } from './types';

type Page = 'home' | 'results' | 'details' | 'seats' | 'passengers' | 'review' | 'confirmation' | 'bookings' | 'booking-detail';

const defaultSearch: SearchValues = { source: 'Chennai', destination: 'Bangalore', date: today(), passengers: 1 };
const blankPassenger = (): Passenger => ({ fullName: '', age: 0, gender: '' as Passenger['gender'] });

function ErrorMessage({ message }: { message?: string }) {
  return message ? <div className="alert" role="alert">{message}</div> : null;
}

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [search, setSearch] = useState(defaultSearch);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setMessage('');
    setIsLoading(true);
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to complete this request.'); }
    finally { setIsLoading(false); }
  };

  const searchTickets = () => run(async () => {
    if (search.source === search.destination) throw new Error('Choose different departure and arrival cities.');
    const result = await api.searchTickets(search.source, search.destination, search.date);
    setTickets(result.tickets);
    setPage('results');
  });

  const chooseTicket = (candidate: Ticket) => run(async () => {
    const result = await api.getTicket(candidate.id, search.date);
    setTicket(result.ticket);
    setSelectedSeats([]);
    setPage('details');
  });

  const openSeatSelection = () => run(async () => {
    if (!ticket) return;
    const result = await api.getSeats(ticket.id, search.date);
    setSeats(result.seats);
    setSelectedSeats([]);
    setPage('seats');
  });

  const continuePassengers = () => {
    if (selectedSeats.length !== search.passengers) {
      setMessage(`Select exactly ${search.passengers} seat${search.passengers === 1 ? '' : 's'} to continue.`);
      return;
    }
    setMessage('');
    setPassengers(selectedSeats.map(() => blankPassenger()));
    setPage('passengers');
  };

  const validatePassengers = () => {
    for (const passenger of passengers) {
      if (passenger.fullName.trim().length < 2) return 'Enter a full name for every passenger.';
      if (!Number.isInteger(passenger.age) || passenger.age < 1 || passenger.age > 120) return 'Enter an age between 1 and 120 for every passenger.';
      if (!passenger.gender) return 'Choose a gender for every passenger.';
    }
    return '';
  };

  const openReview = () => {
    const validationError = validatePassengers();
    if (validationError) { setMessage(validationError); return; }
    setMessage('');
    setPage('review');
  };

  const confirmBooking = () => run(async () => {
    if (!ticket) return;
    const result = await api.createBooking({ ticketId: ticket.id, travelDate: search.date, seats: selectedSeats, passengers });
    setActiveBooking(result.booking);
    setBookings((current) => [result.booking, ...current]);
    setPage('confirmation');
  });

  const openBookings = () => run(async () => {
    const result = await api.getBookings();
    setBookings(result.bookings);
    setPage('bookings');
  });

  const cancelActiveBooking = () => {
    if (!activeBooking || !window.confirm(`Cancel booking ${activeBooking.bookingCode}? The seats will be released.`)) return;
    run(async () => {
      const result = await api.cancelBooking(activeBooking.bookingCode);
      setActiveBooking(result.booking);
      setBookings((current) => current.map((booking) => booking.bookingCode === result.booking.bookingCode ? result.booking : booking));
    });
  };

  const goHome = () => { setMessage(''); setPage('home'); };
  const title = page === 'results' ? 'Available services' : page === 'details' ? 'Service details' : page === 'seats' ? 'Choose your seats' : page === 'passengers' ? 'Passenger details' : page === 'review' ? 'Review your booking' : page === 'bookings' ? 'My bookings' : page === 'booking-detail' ? 'Booking details' : '';

  return <div className="app-shell">
    <header className="site-header"><button className="brand" onClick={goHome}>Ticket<span>Flow</span></button><nav><button onClick={goHome}>Search</button><button onClick={openBookings}>My bookings</button></nav></header>
    {page === 'home' && <main>
      <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(8, 24, 44, .96) 0%, rgba(10, 31, 56, .77) 42%, rgba(10, 31, 56, .10) 75%), url(${heroImage})` }}>
        <div className="hero__content"><span className="eyebrow">Intercity travel, made certain</span><h1>Ticket<span>Flow</span></h1><p>Find your route, choose your seat, and keep every journey in one reliable place.</p><SearchForm values={search} onChange={setSearch} onSubmit={searchTickets} isLoading={isLoading} /><ErrorMessage message={message} /></div>
      </section>
      <section className="service-intro"><div><span className="eyebrow">Built for the journey</span><h2>A simple path from search to seat.</h2></div><p>Live seat availability is checked again when you confirm, so every booking stays dependable.</p><div className="service-intro__points"><span><b>01</b> Search routes</span><span><b>02</b> Select seats</span><span><b>03</b> Travel assured</span></div></section>
    </main>}
    {page !== 'home' && <main className="page-wrap">
      <div className="page-heading"><div><button className="back-link" onClick={page === 'results' ? goHome : () => setPage('results')}>← Back</button><span className="eyebrow">TicketFlow</span><h1>{title}</h1></div>{page === 'results' && <SearchForm compact values={search} onChange={setSearch} onSubmit={searchTickets} isLoading={isLoading} />}</div>
      <ErrorMessage message={message} />
      {page === 'results' && <TicketList tickets={tickets} onSelect={chooseTicket} />}
      {page === 'details' && ticket && <section className="booking-layout"><div><JourneySummary ticket={ticket} search={search} seats={[]} passengers={[]} /><div className="info-list"><span><b>Available seats</b>{ticket.availableSeats} currently available</span><span><b>Travel date</b>{formatDate(search.date)}</span><span><b>Boarding</b>Report 15 minutes before departure</span></div></div><aside className="action-panel"><span>Starting from</span><strong>{formatMoney(ticket.price)}</strong><small>per traveller · all taxes included</small><button className="button button--primary" onClick={openSeatSelection} disabled={isLoading || !ticket.availableSeats}>{isLoading ? 'Loading…' : 'Choose seats'}</button></aside></section>}
      {page === 'seats' && ticket && <section className="booking-layout booking-layout--seats"><div><JourneySummary ticket={ticket} search={search} seats={selectedSeats} passengers={[]} /><SeatGrid seats={seats} selected={selectedSeats} maxSeats={search.passengers} onChange={(next) => { setSelectedSeats(next); setMessage(''); }} /></div><aside className="action-panel"><span>Selected seats</span><strong>{selectedSeats.length} / {search.passengers}</strong><small>{selectedSeats.length ? selectedSeats.join(', ') : 'Choose seats from the layout'}</small><hr /><span>Total</span><strong>{formatMoney(ticket.price * selectedSeats.length)}</strong><button className="button button--primary" onClick={continuePassengers}>Continue</button></aside></section>}
      {page === 'passengers' && <section className="narrow-content">{ticket && <JourneySummary ticket={ticket} search={search} seats={selectedSeats} passengers={passengers} />}<PassengerForm passengers={passengers} seats={selectedSeats} error={message} onChange={(next) => { setPassengers(next); setMessage(''); }} onBack={() => { setMessage(''); setPage('seats'); }} onSubmit={openReview} /></section>}
      {page === 'review' && ticket && <section className="narrow-content"><JourneySummary ticket={ticket} search={search} seats={selectedSeats} passengers={passengers} /><div className="review-passengers"><h2>Passenger details</h2>{passengers.map((passenger, index) => <p key={selectedSeats[index]}><strong>{passenger.fullName}</strong><span>{passenger.age} years · {passenger.gender} · Seat {selectedSeats[index]}</span></p>)}</div><div className="review-total"><span>Total amount</span><strong>{formatMoney(ticket.price * selectedSeats.length)}</strong></div><p className="fine-print">No payment is collected in this demo. Confirming will reserve these seats in the database.</p><div className="page-actions"><button className="button button--ghost" onClick={() => setPage('passengers')}>Edit passengers</button><button className="button button--primary" onClick={confirmBooking} disabled={isLoading}>{isLoading ? 'Confirming…' : 'Confirm booking'}</button></div></section>}
      {page === 'confirmation' && activeBooking && <section className="narrow-content success-content"><span className="success-mark">✓</span><span className="eyebrow">Your journey is confirmed</span><h2>All set for the road.</h2><BookingReceipt booking={activeBooking} /><div className="page-actions"><button className="button button--ghost" onClick={goHome}>Book another trip</button><button className="button button--primary" onClick={openBookings}>View my bookings</button></div></section>}
      {page === 'bookings' && <section className="booking-history">{isLoading ? <div className="empty-state">Loading your bookings…</div> : !bookings.length ? <div className="empty-state"><strong>No bookings yet</strong><span>Your confirmed journeys will appear here.</span><button className="button button--primary" onClick={goHome}>Find a ticket</button></div> : bookings.map((booking) => <article className="booking-row" key={booking.bookingCode}><div><b className={`status status--${booking.status.toLowerCase()}`}>{booking.status}</b><strong>{booking.ticket.operator}</strong><span>{booking.bookingCode} · {formatDate(booking.travelDate)}</span></div><div><strong>{booking.ticket.source} → {booking.ticket.destination}</strong><span>Seats {booking.seats.join(', ')}</span></div><div><strong>{formatMoney(booking.totalAmount)}</strong><button className="text-button" onClick={() => { setActiveBooking(booking); setPage('booking-detail'); }}>View details</button></div></article>)}</section>}
      {page === 'booking-detail' && activeBooking && <section className="narrow-content"><BookingReceipt booking={activeBooking} />{activeBooking.status === 'CONFIRMED' && <button className="button button--danger" onClick={cancelActiveBooking} disabled={isLoading}>{isLoading ? 'Cancelling…' : 'Cancel booking'}</button>}<div className="page-actions"><button className="button button--ghost" onClick={openBookings}>Back to bookings</button></div></section>}
    </main>}
  </div>;
}
