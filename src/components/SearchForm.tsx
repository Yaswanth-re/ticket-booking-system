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
  const update = <K extends keyof SearchValues>(key: K, value: SearchValues[K]) => onChange({ ...values, [key]: value });
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit(); };
  return (
    <form className={`search-form ${compact ? 'search-form--compact' : ''}`} onSubmit={submit}>
      <label>
        <span>From</span>
        <select value={values.source} onChange={(e) => update('source', e.target.value)} aria-label="Departure city">
          {cities.map((city) => <option key={city}>{city}</option>)}
        </select>
      </label>
      <span className="route-arrow" aria-hidden="true">→</span>
      <label>
        <span>To</span>
        <select value={values.destination} onChange={(e) => update('destination', e.target.value)} aria-label="Arrival city">
          {cities.map((city) => <option key={city}>{city}</option>)}
        </select>
      </label>
      <label>
        <span>Date</span>
        <input type="date" min={today()} value={values.date} onChange={(e) => update('date', e.target.value)} />
      </label>
      <label>
        <span>Travellers</span>
        <select value={values.passengers} onChange={(e) => update('passengers', Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6].map((count) => <option value={count} key={count}>{count} {count === 1 ? 'passenger' : 'passengers'}</option>)}
        </select>
      </label>
      <button className="button button--primary" type="submit" disabled={isLoading}>{isLoading ? 'Searching…' : 'Search tickets'}</button>
    </form>
  );
}
