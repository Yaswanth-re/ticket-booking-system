import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { cities, today } from '../lib/format';
import type { SearchValues } from '../types';

interface SearchFormProps {
  values: SearchValues;
  onChange: (values: SearchValues) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  compact?: boolean;
}

export function SearchForm({ values, onChange, onSubmit, isLoading, compact }: SearchFormProps) {
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

  const [sourceSearch, setSourceSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');

  const sourceRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const passengerRef = useRef<HTMLDivElement>(null);

  const update = <K extends keyof SearchValues>(key: K, value: SearchValues[K]) => onChange({ ...values, [key]: value });

  const swapCities = () => {
    onChange({
      ...values,
      source: values.destination,
      destination: values.source,
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (sourceRef.current && !sourceRef.current.contains(target)) {
        setShowSourceDropdown(false);
      }
      if (destRef.current && !destRef.current.contains(target)) {
        setShowDestDropdown(false);
      }
      if (passengerRef.current && !passengerRef.current.contains(target)) {
        setShowPassengerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredSourceCities = cities.filter((city) =>
    city.toLowerCase().includes(sourceSearch.toLowerCase())
  );

  const filteredDestCities = cities.filter((city) =>
    city.toLowerCase().includes(destSearch.toLowerCase())
  );

  return (
    <form className={`search-form ${compact ? 'search-form--compact' : ''}`} onSubmit={submit}>
      <div ref={sourceRef} className="location-select-container">
        <label style={{ borderRight: 'none', padding: 0 }}>
          <span>From</span>
          <button
            type="button"
            className="search-form-select-trigger"
            onClick={() => {
              setShowSourceDropdown(!showSourceDropdown);
              setShowDestDropdown(false);
              setShowPassengerDropdown(false);
              setSourceSearch('');
            }}
            aria-label="Select departure city"
          >
            {values.source || 'Select departure city'}
          </button>
        </label>
        {showSourceDropdown && (
          <div className="location-dropdown-popover">
            <input
              type="text"
              className="location-search-input"
              placeholder="Search city..."
              value={sourceSearch}
              onChange={(e) => setSourceSearch(e.target.value)}
              autoFocus
            />
            <div className="location-options-list">
              {filteredSourceCities.map((city) => (
                <button
                  type="button"
                  key={city}
                  className="location-option-btn"
                  onClick={() => {
                    update('source', city);
                    setShowSourceDropdown(false);
                  }}
                >
                  {city}
                </button>
              ))}
              {filteredSourceCities.length === 0 && (
                <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  No cities found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <button type="button" className="route-swap-btn" onClick={swapCities} title="Swap cities" aria-label="Swap cities">
        ⇄
      </button>

      <div ref={destRef} className="location-select-container">
        <label style={{ borderRight: 'none', padding: 0 }}>
          <span>To</span>
          <button
            type="button"
            className="search-form-select-trigger"
            onClick={() => {
              setShowDestDropdown(!showDestDropdown);
              setShowSourceDropdown(false);
              setShowPassengerDropdown(false);
              setDestSearch('');
            }}
            aria-label="Select destination city"
          >
            {values.destination || 'Select destination city'}
          </button>
        </label>
        {showDestDropdown && (
          <div className="location-dropdown-popover">
            <input
              type="text"
              className="location-search-input"
              placeholder="Search city..."
              value={destSearch}
              onChange={(e) => setDestSearch(e.target.value)}
              autoFocus
            />
            <div className="location-options-list">
              {filteredDestCities.map((city) => (
                <button
                  type="button"
                  key={city}
                  className="location-option-btn"
                  onClick={() => {
                    update('destination', city);
                    setShowDestDropdown(false);
                  }}
                >
                  {city}
                </button>
              ))}
              {filteredDestCities.length === 0 && (
                <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  No cities found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <label>
        <span>Date</span>
        <input type="date" min={today()} value={values.date} onChange={(e) => update('date', e.target.value)} />
      </label>

      <div ref={passengerRef} className="location-select-container">
        <label style={{ borderRight: 'none', padding: 0 }}>
          <span>Travellers</span>
          <button
            type="button"
            className="search-form-select-trigger"
            onClick={() => {
              setShowPassengerDropdown(!showPassengerDropdown);
              setShowSourceDropdown(false);
              setShowDestDropdown(false);
            }}
            aria-label="Select travellers count"
          >
            {values.passengers} {values.passengers === 1 ? 'passenger' : 'passengers'}
          </button>
        </label>
        {showPassengerDropdown && (
          <div className="location-dropdown-popover" style={{ width: 'auto', right: 0, left: 'auto' }}>
            <div className="passenger-popover-content">
              <span>Passengers</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  className="passenger-btn"
                  disabled={values.passengers <= 1}
                  onClick={() => update('passengers', Math.max(1, values.passengers - 1))}
                  title="Decrease passenger count"
                  aria-label="Decrease passenger count"
                >
                  −
                </button>
                <span className="passenger-count-display">{values.passengers}</span>
                <button
                  type="button"
                  className="passenger-btn"
                  disabled={values.passengers >= 9}
                  onClick={() => update('passengers', Math.min(9, values.passengers + 1))}
                  title="Increase passenger count"
                  aria-label="Increase passenger count"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <button className="button button--primary" type="submit" disabled={isLoading}>
        {isLoading ? <div className="loading-spinner" /> : 'Search tickets'}
      </button>
    </form>
  );
}
