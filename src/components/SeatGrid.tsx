import type { Seat } from '../types';

interface SeatGridProps { seats: Seat[]; selected: string[]; maxSeats: number; onChange: (seats: string[]) => void; }

export function SeatGrid({ seats, selected, maxSeats, onChange }: SeatGridProps) {
  const toggle = (seat: Seat) => {
    if (seat.status === 'BOOKED') return;
    if (selected.includes(seat.number)) return onChange(selected.filter((number) => number !== seat.number));
    if (selected.length < maxSeats) onChange([...selected, seat.number]);
  };
  return <>
    <div className="seat-legend" aria-label="Seat legend"><span><i className="seat-key seat-key--available" /> Available</span><span><i className="seat-key seat-key--selected" /> Selected</span><span><i className="seat-key seat-key--booked" /> Booked</span></div>
    <div className="coach" aria-label="Seat layout">
      <div className="coach__front">Driver</div>
      <div className="seat-grid">
        {seats.map((seat) => <button key={seat.id} className={`seat seat--${seat.status.toLowerCase()} ${selected.includes(seat.number) ? 'seat--selected' : ''}`} style={{ gridRow: seat.row, gridColumn: seat.column + (seat.column > 2 ? 1 : 0) }} onClick={() => toggle(seat)} aria-pressed={selected.includes(seat.number)} disabled={seat.status === 'BOOKED'}>{seat.number}</button>)}
      </div>
    </div>
  </>;
}
