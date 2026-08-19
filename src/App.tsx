import { useEffect, useState } from 'react';
import heroImage from './assets/ticketflow-hero.png';
import { AuthForm } from './components/AuthForm';
import { BookingReceipt, JourneySummary } from './components/BookingSummary';
import { PassengerForm } from './components/PassengerForm';
import { PaymentForm } from './components/PaymentForm';
import { SearchForm } from './components/SearchForm';
import { SeatGrid } from './components/SeatGrid';
import { TicketList } from './components/TicketList';
import { api } from './lib/api';
import { formatDate, formatMoney, today } from './lib/format';
import type { Booking, Passenger, Payment, PaymentMethod, SearchValues, Seat, Ticket, User } from './types';

type Page = 'home' | 'results' | 'details' | 'seats' | 'passengers' | 'review' | 'payment' | 'confirmation' | 'bookings' | 'booking-detail' | 'payments' | 'auth';

const defaultSearch: SearchValues = { source: '', destination: '', date: today(), passengers: 1 };
const blankPassenger = (): Passenger => ({ fullName: '', age: 0, gender: '' as Passenger['gender'] });
const defaultPayment = { method: 'UPI' as PaymentMethod, reference: '' };

function ErrorMessage({ message }: { message?: string }) {
  return message ? <div className="alert" role="alert">{message}</div> : null;
}

function ProgressTracker({ currentPage }: { currentPage: Page }) {
  const steps = [
    { key: 'results', label: 'Search' },
    { key: 'seats', label: 'Seats' },
    { key: 'passengers', label: 'Passengers' },
    { key: 'review', label: 'Review' },
    { key: 'payment', label: 'Payment' }
  ];

  const getStepIndex = (pg: string) => {
    if (pg === 'results') return 0;
    if (pg === 'seats') return 1;
    if (pg === 'passengers') return 2;
    if (pg === 'review') return 3;
    if (pg === 'payment') return 4;
    return -1;
  };

  const currentIndex = getStepIndex(currentPage);
  if (currentIndex === -1) return null;

  return (
    <div className="progress-tracker">
      {steps.map((step, idx) => {
        let stepClass = 'progress-step';
        if (idx === currentIndex) stepClass += ' progress-step--active';
        else if (idx < currentIndex) stepClass += ' progress-step--completed';
        
        return (
          <div key={step.key} className={stepClass}>
            <div className="progress-step__node">
              {idx < currentIndex ? '✓' : idx + 1}
            </div>
            <div className="progress-step__label">{step.label}</div>
          </div>
        );
      })}
    </div>
  );
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [paymentDraft, setPaymentDraft] = useState(defaultPayment);
  const [user, setUser] = useState<User | null>(null);
  const [authReturnPage, setAuthReturnPage] = useState<Page>('home');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { void api.getCurrentUser().then(setUser).catch(() => setUser(null)); }, []);

  const run = async (action: () => Promise<void>) => {
    setMessage('');
    setIsLoading(true);
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to complete this request.'); }
    finally { setIsLoading(false); }
  };

  const searchTickets = () => run(async () => {
    if (!search.source) {
      throw new Error('Please select your departure location.');
    }
    if (!search.destination) {
      throw new Error('Please select your destination.');
    }
    if (search.source === search.destination) {
      throw new Error('Departure and destination cannot be the same.');
    }
    if (!search.date) {
      throw new Error('Please select a valid travel date.');
    }
    if (search.passengers < 1) {
      throw new Error('Please select at least 1 passenger.');
    }
    const result = await api.searchTickets(search.source, search.destination, search.date);
    setTickets(result.tickets);
    setPage('results');
  });

  const chooseTicket = (candidate: Ticket) => run(async () => {
    const result = await api.getTicket(candidate.id, search.date);
    setTicket(result.ticket);
    const seatsResult = await api.getSeats(candidate.id, search.date);
    setSeats(seatsResult.seats);
    setSelectedSeats([]);
    setPage('seats');
  });

  const continuePassengers = () => {
    if (selectedSeats.length === 0) {
      setMessage('Select at least one seat to continue.');
      return;
    }
    if (selectedSeats.length > 6) {
      setMessage('You can select a maximum of 6 seats.');
      return;
    }
    setMessage('');
    setSearch((prev) => ({ ...prev, passengers: selectedSeats.length }));
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

  const openAuthentication = (returnPage: Page = 'home') => {
    setMessage('');
    setAuthReturnPage(returnPage);
    setPage('auth');
  };

  const authenticate = async (input: { mode: 'login' | 'signup'; fullName: string; email: string; password: string }) => {
    const result = input.mode === 'signup'
      ? await api.signup({ fullName: input.fullName, email: input.email, password: input.password })
      : await api.login({ email: input.email, password: input.password });
    setUser(result.user);
    if (authReturnPage === 'bookings') {
      const history = await api.getBookings();
      setBookings(history.bookings);
    }
    if (authReturnPage === 'payments') {
      const history = await api.getPayments();
      setPayments(history.payments);
    }
    setPage(authReturnPage);
  };

  const openPayment = () => {
    if (!user) { openAuthentication('review'); return; }
    setMessage('');
    setPaymentDraft(defaultPayment);
    setPage('payment');
  };

  const confirmBooking = () => {
    if (!user) { openAuthentication('review'); return; }
    run(async () => {
    if (!ticket) return;
    const result = await api.createBooking({ ticketId: ticket.id, travelDate: search.date, seats: selectedSeats, passengers, payment: paymentDraft });
    setActiveBooking(result.booking);
    setBookings((current) => [result.booking, ...current]);
    setPage('confirmation');
    });
  };

  const openBookings = () => {
    if (!user) { openAuthentication('bookings'); return; }
    run(async () => {
    const result = await api.getBookings();
    setBookings(result.bookings);
    setPage('bookings');
    });
  };

  const openPayments = () => {
    if (!user) { openAuthentication('payments'); return; }
    run(async () => {
      const history = await api.getPayments();
      setPayments(history.payments);
      setPage('payments');
    });
  };

  const logout = () => run(async () => {
    await api.logout();
    setUser(null);
    setBookings([]);
    setPayments([]);
    setActiveBooking(null);
    setPage('home');
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
  const title = page === 'results' ? 'Available services' : page === 'seats' ? 'Choose your seats' : page === 'passengers' ? 'Passenger details' : page === 'review' ? 'Review your booking' : page === 'payment' ? 'Payment method' : page === 'bookings' ? 'My bookings' : page === 'payments' ? 'Payment history' : page === 'booking-detail' ? 'Booking details' : '';

  const handleBack = () => {
    setMessage('');
    if (page === 'results') goHome();
    else if (page === 'seats') setPage('results');
    else if (page === 'passengers') setPage('seats');
    else if (page === 'review') setPage('passengers');
    else if (page === 'payment') setPage('review');
    else if (page === 'payments') openBookings();
    else setPage('results');
  };

  return <div className="app-shell">
    <header className="site-header"><button className="brand" onClick={goHome}>Ticket<span>Flow</span></button><nav><button onClick={goHome}>Search</button><button className="nav-secondary" onClick={openBookings}>My bookings</button>{user ? <><button className="nav-secondary" onClick={openPayments}>Payments</button><button className="account-button" onClick={openBookings} title="Open your bookings"><i>{user.fullName.charAt(0).toUpperCase()}</i><span>{user.fullName.split(' ')[0]}</span></button><button className="nav-login" onClick={logout} disabled={isLoading}>Log out</button></> : <button className="nav-login" onClick={() => openAuthentication('home')}>Log in</button>}</nav></header>
    {page === 'auth' && <AuthForm initialMode={authReturnPage === 'review' ? 'signup' : 'login'} onAuthenticate={authenticate} onBack={goHome} />}
    {page === 'home' && <main>
      <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(8, 24, 44, .96) 0%, rgba(10, 31, 56, .77) 42%, rgba(10, 31, 56, .10) 75%), url(${heroImage})` }}>
        <div className="hero__content"><span className="eyebrow">Intercity travel, made certain</span><h1>Ticket<span>Flow</span></h1><p>Find your route, choose your seat, and keep every journey in one reliable place.</p><SearchForm values={search} onChange={setSearch} onSubmit={searchTickets} isLoading={isLoading} /><ErrorMessage message={message} /></div>
      </section>

      {/* Promotional Cards */}
      <section className="landing-promos">
        <h2 className="section-title">Exclusive Offers</h2>
        <p className="section-desc">Get the best deals on your bus bookings with TicketFlow.</p>
        <div className="promo-grid">
          <div className="promo-card">
            <div className="promo-card__content">
              <h3>Save Flat 15%</h3>
              <p>On your first booking with TicketFlow. Valid for new users only.</p>
              <div className="promo-code">Use Code: FIRST15</div>
            </div>
            <span style={{ fontSize: '48px' }}>🎉</span>
          </div>
          <div className="promo-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' }}>
            <div className="promo-card__content">
              <h3>Super Saver Discount</h3>
              <p>Get up to ₹250 discount on round trip booking on selected routes.</p>
              <div className="promo-code" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>Use Code: ROUNDTRIP</div>
            </div>
            <span style={{ fontSize: '48px' }}>🚌</span>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="popular-routes">
        <h2 className="section-title">Popular Bus Routes</h2>
        <p className="section-desc">Book tickets for top routes across the country with live seat mapping.</p>
        <div className="routes-grid">
          {[
            { source: 'Bangalore', dest: 'Chennai', price: 799 },
            { source: 'Chennai', dest: 'Bangalore', price: 899 },
            { source: 'Hyderabad', dest: 'Bangalore', price: 1149 },
            { source: 'Bangalore', dest: 'Hyderabad', price: 1149 },
            { source: 'Mumbai', dest: 'Goa', price: 1399 },
            { source: 'Pune', dest: 'Goa', price: 1349 },
            { source: 'Mumbai', dest: 'Pune', price: 549 },
            { source: 'Chennai', dest: 'Coimbatore', price: 949 }
          ].map((route, i) => (
            <button 
              key={i} 
              className="route-card"
              onClick={() => {
                const nextSearch = { ...search, source: route.source, destination: route.dest, date: today() };
                setSearch(nextSearch);
                run(async () => {
                  const result = await api.searchTickets(route.source, route.dest, today());
                  setTickets(result.tickets);
                  setPage('results');
                });
              }}
            >
              <div className="route-card__cities">{route.source} ➔ {route.dest}</div>
              <div className="route-card__meta">
                <span>Daily buses</span>
                <span className="route-card__price">from {formatMoney(route.price)}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="service-intro"><div><span className="eyebrow">Built for the journey</span><h2>A simple path from search to seat.</h2></div><p>Live seat availability is checked again when you confirm, so every booking stays dependable.</p><div className="service-intro__points"><span><b>01</b> Search routes</span><span><b>02</b> Select seats</span><span><b>03</b> Travel assured</span></div></section>
    </main>}
    {page !== 'home' && page !== 'auth' && <main className="page-wrap">
      {/* Progress step-by-step tracker */}
      <ProgressTracker currentPage={page} />

      <div className="page-heading"><div><button className="back-link" onClick={handleBack}>← Back</button><span className="eyebrow">TicketFlow</span><h1>{title}</h1></div>{page === 'results' && <SearchForm compact values={search} onChange={setSearch} onSubmit={searchTickets} isLoading={isLoading} />}</div>
      <ErrorMessage message={message} />
      {page === 'results' && <TicketList tickets={tickets} onSelect={chooseTicket} />}
      {page === 'seats' && ticket && <section className="booking-layout booking-layout--seats"><div><JourneySummary ticket={ticket} search={search} seats={selectedSeats} passengers={[]} /><SeatGrid seats={seats} selected={selectedSeats} maxSeats={6} vehicle={ticket.vehicle} onChange={(next) => { setSelectedSeats(next); setMessage(''); }} /></div><aside className="action-panel"><span>Selected seats</span><strong>{selectedSeats.length} / 6</strong><small>{selectedSeats.length ? selectedSeats.join(', ') : 'Choose seats from the layout'}</small><hr /><span>Total</span><strong>{formatMoney(ticket.price * selectedSeats.length)}</strong><button className="button button--primary" onClick={continuePassengers}>Continue</button></aside></section>}
      {page === 'passengers' && <section className="narrow-content">{ticket && <JourneySummary ticket={ticket} search={search} seats={selectedSeats} passengers={passengers} />}<PassengerForm passengers={passengers} seats={selectedSeats} error={message} onChange={(next) => { setPassengers(next); setMessage(''); }} onBack={() => { setMessage(''); setPage('seats'); }} onSubmit={openReview} /></section>}
      {page === 'review' && ticket && <section className="narrow-content"><JourneySummary ticket={ticket} search={search} seats={selectedSeats} passengers={passengers} /><div className="review-passengers"><h2>Passenger details</h2>{passengers.map((passenger, index) => <p key={selectedSeats[index]}><strong>{passenger.fullName}</strong><span>{passenger.age} years · {passenger.gender} · Seat {selectedSeats[index]}</span></p>)}</div><div className="review-total"><span>Total amount</span><strong>{formatMoney(ticket.price * selectedSeats.length)}</strong></div><p className="fine-print">{user ? `Booking as ${user.email}. Continue to choose a local demo payment method.` : 'Log in or create an account to save this reservation securely.'}</p><div className="page-actions"><button className="button button--ghost" onClick={() => setPage('passengers')}>Edit passengers</button><button className="button button--primary" onClick={openPayment} disabled={isLoading}>{user ? 'Continue to payment' : 'Log in to continue'}</button></div></section>}
      {page === 'payment' && ticket && <section className="narrow-content payment-content"><JourneySummary ticket={ticket} search={search} seats={selectedSeats} passengers={passengers} /><PaymentForm amount={ticket.price * selectedSeats.length} method={paymentDraft.method} reference={paymentDraft.reference} isProcessing={isLoading} error={message} onChange={(next) => { setPaymentDraft(next); setMessage(''); }} onBack={() => { setMessage(''); setPage('review'); }} onSubmit={confirmBooking} /></section>}
      {page === 'confirmation' && activeBooking && <section className="narrow-content success-content"><span className="success-mark">✓</span><span className="eyebrow">Your journey is confirmed</span><h2>All set for the road.</h2><BookingReceipt booking={activeBooking} /><div className="page-actions"><button className="button button--ghost" onClick={goHome}>Book another trip</button><button className="button button--primary" onClick={openBookings}>View my bookings</button></div></section>}
      {page === 'bookings' && <section className="booking-history">{isLoading ? <div className="empty-state">Loading your bookings…</div> : !bookings.length ? <div className="empty-state"><strong>No bookings yet</strong><span>Your confirmed journeys will appear here.</span><button className="button button--primary" onClick={goHome}>Find a ticket</button></div> : bookings.map((booking) => <article className="booking-row" key={booking.bookingCode}><div><b className={`status status--${booking.status.toLowerCase()}`}>{booking.status}</b><strong>{booking.ticket.operator}</strong><span>{booking.bookingCode} · {formatDate(booking.travelDate)}</span></div><div><strong>{booking.ticket.source} → {booking.ticket.destination}</strong><span>Seats {booking.seats.join(', ')} · {booking.payment?.method ?? 'Legacy payment'}</span></div><div><strong>{formatMoney(booking.totalAmount)}</strong><button className="text-button" onClick={() => { setActiveBooking(booking); setPage('booking-detail'); }}>View details</button></div></article>)}</section>}
      {page === 'payments' && <section className="payment-history">{isLoading ? <div className="empty-state">Loading payment history…</div> : !payments.length ? <div className="empty-state"><strong>No payments yet</strong><span>Payments made for your future bookings will appear here.</span><button className="button button--primary" onClick={goHome}>Find a ticket</button></div> : payments.map((payment) => <article className="payment-row" key={payment.paymentCode}><div className="payment-row__method"><i>{payment.method === 'UPI' ? 'UPI' : payment.method === 'CARD' ? '••••' : 'W'}</i><span><strong>{payment.method === 'CARD' ? 'Card payment' : payment.method === 'WALLET' ? 'Wallet payment' : 'UPI payment'}</strong><small>{payment.referenceLabel}</small></span></div><div><strong>{payment.ticket ? `${payment.ticket.source} → ${payment.ticket.destination}` : 'TicketFlow booking'}</strong><small>{payment.bookingCode} · {formatDate(payment.paidAt.slice(0, 10))}</small></div><div><b className="status status--paid">PAID</b><strong>{formatMoney(payment.amount)}</strong></div></article>)}</section>}
      {page === 'booking-detail' && activeBooking && <section className="narrow-content"><BookingReceipt booking={activeBooking} />{activeBooking.status === 'CONFIRMED' && <button className="button button--danger" onClick={cancelActiveBooking} disabled={isLoading}>{isLoading ? 'Cancelling…' : 'Cancel booking'}</button>}<div className="page-actions"><button className="button button--ghost" onClick={openBookings}>Back to bookings</button></div></section>}
    </main>}
  </div>;
}
