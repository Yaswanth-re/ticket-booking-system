import { formatDuration, formatMoney } from '../lib/format';
import type { Ticket } from '../types';

interface TicketListProps { tickets: Ticket[]; onSelect: (ticket: Ticket) => void; }

export function TicketList({ tickets, onSelect }: TicketListProps) {
  if (!tickets.length) return <div className="empty-state"><strong>No services found</strong><span>Try a different route or travel date.</span></div>;
  return <div className="ticket-list">
    {tickets.map((ticket) => <article className="ticket-row" key={ticket.id}>
      <div className="ticket-row__operator"><strong>{ticket.operator}</strong><span>{ticket.serviceCode} · {ticket.vehicle}</span></div>
      <div className="ticket-row__route"><strong>{ticket.departureTime}</strong><span>{ticket.source}</span></div>
      <div className="ticket-row__journey"><span>{formatDuration(ticket.durationMinutes)}</span><i /><span>{ticket.arrivalTime}</span></div>
      <div className="ticket-row__route"><strong>{ticket.arrivalTime}</strong><span>{ticket.destination}</span></div>
      <div className="ticket-row__availability"><strong>{ticket.availableSeats}</strong><span>seats left</span></div>
      <div className="ticket-row__price"><strong>{formatMoney(ticket.price)}</strong><span>per traveller</span></div>
      <button className="button button--secondary" onClick={() => onSelect(ticket)} disabled={!ticket.availableSeats}>{ticket.availableSeats ? 'View seats' : 'Sold out'}</button>
    </article>)}
  </div>;
}
