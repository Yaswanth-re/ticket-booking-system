import { useState, type FormEvent } from 'react';
import heroImage from '../assets/ticketflow-hero.png';

interface AuthFormProps {
  initialMode?: 'login' | 'signup';
  onAuthenticate: (input: { mode: 'login' | 'signup'; fullName: string; email: string; password: string }) => Promise<void>;
  onBack: () => void;
}

export function AuthForm({ initialMode = 'login', onAuthenticate, onBack }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try { await onAuthenticate({ mode, fullName, email, password }); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to continue.'); }
    finally { setIsSubmitting(false); }
  };

  const switchMode = (nextMode: 'login' | 'signup') => {
    setMode(nextMode);
    setError('');
  };

  return <section className="auth-page">
    <aside className="auth-page__story" style={{ backgroundImage: `linear-gradient(145deg, rgba(8, 24, 44, .98), rgba(10, 31, 56, .66)), url(${heroImage})` }}><button className="brand" onClick={onBack}>Ticket<span>Flow</span></button><div><span className="eyebrow">Travel on your terms</span><h1>Your journeys, <em>kept together.</em></h1><p>Create an account to keep your bookings secure, accessible, and entirely yours.</p></div><small>Secure account · Booking history · Easy cancellation</small></aside>
    <div className="auth-page__form-wrap"><div className="auth-card"><button className="back-link" onClick={onBack}>← Back to search</button><span className="eyebrow">Account</span><h2>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h2><p>{mode === 'login' ? 'Log in to access your trips and make a reservation.' : 'A few details and you’re ready to travel.'}</p><div className="auth-switch" role="tablist"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Log in</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>Sign up</button></div><form onSubmit={submit} className="auth-form">
      {mode === 'signup' && <label>First name<input required minLength={2} maxLength={24} pattern="[A-Za-z]+" value={fullName} onChange={(event) => setFullName(event.target.value.replace(/[^A-Za-z]/g, ''))} placeholder="For example, Asha" autoComplete="given-name" /></label>}
      <label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
      <label>Password<input required type="password" minLength={mode === 'signup' ? 10 : 8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'signup' ? '10+ chars, Aa1#' : 'Your password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
      {mode === 'signup' && <small className="password-help">Use 10+ characters, including uppercase, lowercase, a number, and a symbol.</small>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button--primary" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
    </form></div></div>
  </section>;
}
