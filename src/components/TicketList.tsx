import { useState } from 'react';
import { formatDuration, formatMoney } from '../lib/format';
import type { Ticket } from '../types';

interface TicketListProps { tickets: Ticket[]; onSelect: (ticket: Ticket) => void; }

export function TicketList({ tickets, onSelect }: TicketListProps) {
  // Filter states
  const [filterSleeper, setFilterSleeper] = useState(false);
  const [filterSeater, setFilterSeater] = useState(false);
  const [filterMorning, setFilterMorning] = useState(false);
  const [filterAfternoon, setFilterAfternoon] = useState(false);
  const [filterNight, setFilterNight] = useState(false);
  const [filterWifi, setFilterWifi] = useState(false);
  const [filterWater, setFilterWater] = useState(false);

  // Sorting state
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'departure' | 'duration'>('price');

  // Filter implementation
  const filteredTickets = tickets.filter((ticket) => {
    if (filterSleeper && !ticket.vehicle.toLowerCase().includes('sleeper')) return false;
    if (filterSeater && !ticket.vehicle.toLowerCase().includes('seater')) return false;

    const hour = parseInt(ticket.departureTime.split(':')[0], 10);
    if (filterMorning || filterAfternoon || filterNight) {
      let timeMatch = false;
      if (filterMorning && hour < 12) timeMatch = true;
      if (filterAfternoon && hour >= 12 && hour < 18) timeMatch = true;
      if (filterNight && hour >= 18) timeMatch = true;
      if (!timeMatch) return false;
    }

    if (filterWifi && !ticket.amenities.some((a) => a.toLowerCase().includes('wi-fi'))) return false;
    if (filterWater && !ticket.amenities.some((a) => a.toLowerCase().includes('water'))) return false;

    return true;
  });

  // Sort implementation
  filteredTickets.sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'departure') return a.departureTime.localeCompare(b.departureTime);
    if (sortBy === 'duration') return a.durationMinutes - b.durationMinutes;
    return 0;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const resetFilters = () => {
    setFilterSleeper(false);
    setFilterSeater(false);
    setFilterMorning(false);
    setFilterAfternoon(false);
    setFilterNight(false);
    setFilterWifi(false);
    setFilterWater(false);
  };

  return (
    <div className="results-container">
      {/* Filters Sidebar */}
      <aside className="filters-sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Filters</h3>
          <button onClick={resetFilters} className="text-button" style={{ fontSize: '12px', fontWeight: 700 }}>Reset All</button>
        </div>

        <div className="filter-section">
          <h4>Bus Type</h4>
          <div className="filter-options">
            <label className="filter-label">
              <input type="checkbox" checked={filterSleeper} onChange={(e) => setFilterSleeper(e.target.checked)} />
              Sleeper
            </label>
            <label className="filter-label">
              <input type="checkbox" checked={filterSeater} onChange={(e) => setFilterSeater(e.target.checked)} />
              Seater
            </label>
          </div>
        </div>

        <div className="filter-section">
          <h4>Departure Time</h4>
          <div className="filter-options">
            <label className="filter-label">
              <input type="checkbox" checked={filterMorning} onChange={(e) => setFilterMorning(e.target.checked)} />
              Morning (Before 12 PM)
            </label>
            <label className="filter-label">
              <input type="checkbox" checked={filterAfternoon} onChange={(e) => setFilterAfternoon(e.target.checked)} />
              Afternoon (12 PM - 6 PM)
            </label>
            <label className="filter-label">
              <input type="checkbox" checked={filterNight} onChange={(e) => setFilterNight(e.target.checked)} />
              Evening / Night (After 6 PM)
            </label>
          </div>
        </div>

        <div className="filter-section">
          <h4>Amenities</h4>
          <div className="filter-options">
            <label className="filter-label">
              <input type="checkbox" checked={filterWifi} onChange={(e) => setFilterWifi(e.target.checked)} />
              Free Wi-Fi
            </label>
            <label className="filter-label">
              <input type="checkbox" checked={filterWater} onChange={(e) => setFilterWater(e.target.checked)} />
              Water Bottle
            </label>
          </div>
        </div>
      </aside>

      {/* Main Results Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Sorting Tabs */}
        <div className="sort-tabs" role="tablist" aria-label="Sort options">
          <button className={`sort-tab ${sortBy === 'price' ? 'sort-tab--active' : ''}`} onClick={() => setSortBy('price')}>
            Cheapest First
          </button>
          <button className={`sort-tab ${sortBy === 'rating' ? 'sort-tab--active' : ''}`} onClick={() => setSortBy('rating')}>
            Highest Rated
          </button>
          <button className={`sort-tab ${sortBy === 'departure' ? 'sort-tab--active' : ''}`} onClick={() => setSortBy('departure')}>
            Earliest Departure
          </button>
          <button className={`sort-tab ${sortBy === 'duration' ? 'sort-tab--active' : ''}`} onClick={() => setSortBy('duration')}>
            Shortest Journey
          </button>
        </div>

        {/* Bus List */}
        {!filteredTickets.length ? (
          <div className="empty-state">
            <strong>No matching services found</strong>
            <span>Try resetting filters or adjusting search parameters.</span>
            <button className="button button--ghost" onClick={resetFilters}>Clear Filters</button>
          </div>
        ) : (
          <div className="ticket-list">
            {filteredTickets.map((ticket) => {
              const isLowRating = ticket.rating < 4.2;
              const isSeatsLow = ticket.availableSeats <= 5;
              return (
                <article className="ticket-row" key={ticket.id}>
                  {/* Operator Info */}
                  <div className="ticket-row__operator">
                    <div className="ticket-row__operator-logo">
                      <div className="account-button" style={{ padding: 0, background: 'transparent' }}>
                        <i>{getInitials(ticket.operator)}</i>
                      </div>
                      <div>
                        <strong>{ticket.operator}</strong>
                        <span className="operator-tag">{ticket.serviceCode}</span>
                      </div>
                    </div>
                    <span>{ticket.vehicle}</span>
                  </div>

                  {/* Rating */}
                  <div>
                    <span className={`rating-badge ${isLowRating ? 'rating-badge--low' : ''}`}>
                      ★ {ticket.rating.toFixed(1)}
                    </span>
                    <span>Verified Trip</span>
                  </div>

                  {/* Departure time */}
                  <div className="ticket-row__route">
                    <strong>{ticket.departureTime}</strong>
                    <span>{ticket.source}</span>
                  </div>

                  {/* Duration Line */}
                  <div className="ticket-row__journey">
                    <span>{formatDuration(ticket.durationMinutes)}</span>
                    <i />
                    <span>Direct</span>
                  </div>

                  {/* Arrival time */}
                  <div className="ticket-row__route">
                    <strong>{ticket.arrivalTime}</strong>
                    <span>{ticket.destination}</span>
                  </div>

                  {/* Available Seats */}
                  <div className={`ticket-row__availability ${isSeatsLow ? 'ticket-row__availability--critical' : ''}`}>
                    <strong>{ticket.availableSeats}</strong>
                    <span>seats left</span>
                  </div>

                  {/* Price & CTA */}
                  <div className="ticket-row__price">
                    <strong>{formatMoney(ticket.price)}</strong>
                    <span>per seat</span>
                  </div>

                  {/* Select CTA */}
                  <button className="button button--primary" style={{ gridColumn: 'span 7', width: '100%', minHeight: '40px', marginTop: '12px' }} onClick={() => onSelect(ticket)} disabled={!ticket.availableSeats}>
                    {ticket.availableSeats ? 'Select Seats' : 'Sold Out'}
                  </button>

                  {/* Amenities Preview */}
                  <div className="amenities-preview">
                    {ticket.amenities.map((amenity) => (
                      <span className="amenity-tag" key={amenity}>
                        {amenity}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
