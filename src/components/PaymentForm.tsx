import type { FormEvent } from 'react';
import { formatMoney } from '../lib/format';
import type { PaymentMethod } from '../types';

interface PaymentFormProps {
  amount: number;
  method: PaymentMethod;
  reference: string;
  isProcessing: boolean;
  error?: string;
  onChange: (next: { method: PaymentMethod; reference: string }) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const methods: Array<{ id: PaymentMethod; label: string; description: string; mark: string }> = [
  { id: 'UPI', label: 'UPI', description: 'Use a virtual payment ID', mark: 'UPI' },
  { id: 'CARD', label: 'Debit or credit card', description: 'Only your last four digits', mark: '••••' },
  { id: 'WALLET', label: 'Wallet', description: 'Use your wallet handle', mark: 'W' },
];

function fieldFor(method: PaymentMethod) {
  if (method === 'UPI') return { label: 'UPI ID', placeholder: 'name@bank', hint: 'Example: asha@upi' };
  if (method === 'CARD') return { label: 'Last four card digits', placeholder: '2048', hint: 'Never enter your complete card number.' };
  return { label: 'Wallet handle', placeholder: 'your.wallet', hint: 'Use a short wallet username or handle.' };
}

export function PaymentForm({ amount, method, reference, isProcessing, error, onChange, onBack, onSubmit }: PaymentFormProps) {
  const field = fieldFor(method);
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit(); };
  return <form className="payment-form" onSubmit={submit}>
    <div className="demo-payment-note"><span>Demo checkout</span><p>Payment is recorded locally for this project. Do not enter real financial details.</p></div>
    <div className="payment-methods" role="radiogroup" aria-label="Payment method">
      {methods.map((item) => <button type="button" role="radio" aria-checked={method === item.id} key={item.id} className={`payment-method ${method === item.id ? 'payment-method--selected' : ''}`} onClick={() => onChange({ method: item.id, reference: '' })}><i>{item.mark}</i><span><strong>{item.label}</strong><small>{item.description}</small></span><b>{method === item.id ? '✓' : ''}</b></button>)}
    </div>
    <label className="payment-field">{field.label}<input required value={reference} maxLength={method === 'CARD' ? 4 : 64} inputMode={method === 'CARD' ? 'numeric' : 'text'} pattern={method === 'CARD' ? '\\d{4}' : undefined} onChange={(event) => onChange({ method, reference: method === 'CARD' ? event.target.value.replace(/\D/g, '').slice(0, 4) : event.target.value })} placeholder={field.placeholder} /><small>{field.hint}</small></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="payment-total"><span>Amount to record</span><strong>{formatMoney(amount)}</strong></div>
    <div className="page-actions"><button type="button" className="button button--ghost" onClick={onBack}>Back to review</button><button className="button button--primary" disabled={isProcessing}>{isProcessing ? 'Recording payment…' : `Pay ${formatMoney(amount)}`}</button></div>
  </form>;
}
