import type { FormEvent } from 'react';
import type { Passenger } from '../types';

interface PassengerFormProps {
  passengers: Passenger[];
  seats: string[];
  error?: string;
  onChange: (passengers: Passenger[]) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function PassengerForm({ passengers, seats, error, onChange, onBack, onSubmit }: PassengerFormProps) {
  const update = (index: number, field: keyof Passenger, value: string | number) => onChange(passengers.map((passenger, i) => i === index ? { ...passenger, [field]: value } : passenger));
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit(); };
  return <form className="passenger-form" onSubmit={submit}>
    {passengers.map((passenger, index) => <fieldset key={seats[index]} className="passenger-fields">
      <legend>Passenger {index + 1} <span>Seat {seats[index]}</span></legend>
      <label>Full name<input value={passenger.fullName} onChange={(e) => update(index, 'fullName', e.target.value)} placeholder="As on your ID" autoComplete="name" /></label>
      <label>Age<input type="number" min="1" max="120" value={passenger.age || ''} onChange={(e) => update(index, 'age', Number(e.target.value))} /></label>
      <label>Gender<select value={passenger.gender} onChange={(e) => update(index, 'gender', e.target.value)}><option value="">Select</option><option>Female</option><option>Male</option><option>Other</option></select></label>
    </fieldset>)}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="page-actions"><button className="button button--ghost" type="button" onClick={onBack}>Back to seats</button><button className="button button--primary" type="submit">Review booking</button></div>
  </form>;
}
