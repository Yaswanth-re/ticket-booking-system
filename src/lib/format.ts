export const cities = ['Bangalore', 'Chennai', 'Coimbatore', 'Delhi', 'Goa', 'Hyderabad', 'Kanyakumari', 'Kochi', 'Madurai', 'Mangalore', 'Mumbai', 'Mysore', 'Ooty', 'Pondicherry', 'Pune', 'Tirupati', 'Trichy', 'Vellore', 'Vijayawada', 'Visakhapatnam'];

export const today = () => new Date().toISOString().slice(0, 10);

export function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDuration(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}
