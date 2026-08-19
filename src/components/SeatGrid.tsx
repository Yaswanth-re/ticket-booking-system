import { useState } from 'react';
import type { Seat } from '../types';

interface SeatGridProps {
  seats: Seat[];
  selected: string[];
  maxSeats: number;
  vehicle: string;
  onChange: (seats: string[]) => void;
}

export function SeatGrid({ seats, selected, maxSeats, vehicle, onChange }: SeatGridProps) {
  const isSleeper = vehicle.toLowerCase().includes('sleeper');
  const [activeDeck, setActiveDeck] = useState<'lower' | 'upper'>('lower');

  const toggle = (seat: Seat) => {
    if (seat.status === 'BOOKED') return;
    if (selected.includes(seat.number)) {
      return onChange(selected.filter((number) => number !== seat.number));
    }
    if (selected.length < maxSeats) {
      onChange([...selected, seat.number]);
    }
  };

  // Filter seats based on deck if it is a sleeper
  const visibleSeats = seats.filter((seat) => {
    if (!isSleeper) return true;
    if (activeDeck === 'lower') {
      return seat.row <= 5;
    } else {
      return seat.row > 5;
    }
  });

  return (
    <div className="coach-container">
      {/* Sleeper Deck Selector */}
      {isSleeper && (
        <div className="deck-selector">
          <button type="button" className={`deck-btn ${activeDeck === 'lower' ? 'deck-btn--active' : ''}`} onClick={() => setActiveDeck('lower')}>
            Lower Deck
          </button>
          <button type="button" className={`deck-btn ${activeDeck === 'upper' ? 'deck-btn--active' : ''}`} onClick={() => setActiveDeck('upper')}>
            Upper Deck
          </button>
        </div>
      )}

      {/* Seat Legend */}
      <div className="seat-legend" aria-label="Seat legend">
        <span>
          <i className="seat-key seat-key--available" /> Available
        </span>
        <span>
          <i className="seat-key seat-key--selected" /> Selected
        </span>
        <span>
          <i className="seat-key seat-key--booked-male" /> Booked (Male)
        </span>
        <span>
          <i className="seat-key seat-key--booked-female" /> Booked (Female)
        </span>
      </div>

      {/* Realistic Bus Body */}
      <div className="coach" aria-label="Seat layout">
        <div className="coach__front">
          <div className="steering-wheel" />
          <span>Driver</span>
        </div>

        <div className="seat-grid" style={{ gridTemplateRows: `repeat(${isSleeper ? 5 : 10}, 42px)` }}>
          {visibleSeats.map((seat) => {
            const isSelected = selected.includes(seat.number);
            const isBooked = seat.status === 'BOOKED';
            
            // Mock gender booked seats dynamically for authentic RedBus style
            let bookedClass = '';
            if (isBooked) {
              bookedClass = seat.id % 3 === 0 ? 'seat--booked-female' : 'seat--booked-male';
            }

            // Adjust rows for grid placement (upper deck row indices range from 6 to 10, offset to 1-5 for grid display)
            const displayRow = isSleeper && activeDeck === 'upper' ? seat.row - 5 : seat.row;

            return (
              <button
                key={seat.id}
                type="button"
                className={`seat ${isBooked ? 'seat--booked' : ''} ${bookedClass} ${isSelected ? 'seat--selected' : ''}`}
                style={{
                  gridRow: displayRow,
                  gridColumn: seat.column + (seat.column > 2 ? 1 : 0),
                  height: isSleeper ? '36px' : '40px',
                  borderRadius: isSleeper ? '4px' : '8px',
                  // Sleeper berths are longer than normal seats
                  boxShadow: isSleeper ? 'inset 0 0 0 1px rgba(0,0,0,0.05)' : 'none',
                }}
                onClick={() => toggle(seat)}
                aria-pressed={isSelected}
                disabled={isBooked}
                title={`Seat ${seat.number} (${isBooked ? 'Booked' : 'Available'})`}
              >
                {seat.number}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
