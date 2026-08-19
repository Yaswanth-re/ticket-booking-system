import { db } from '../db/index.js';
import type { Payment, PaymentMethod } from '../types.js';

interface PaymentRow {
  id: number;
  payment_code: string;
  booking_code: string;
  amount: number;
  method: PaymentMethod;
  status: 'PAID';
  reference_label: string;
  paid_at: string;
  operator?: string;
  source?: string;
  destination?: string;
}

function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    paymentCode: row.payment_code,
    bookingCode: row.booking_code,
    amount: row.amount,
    method: row.method,
    status: row.status,
    referenceLabel: row.reference_label,
    paidAt: row.paid_at,
    ticket: row.operator && row.source && row.destination ? { operator: row.operator, source: row.source, destination: row.destination } : undefined,
  };
}

export function insertPayment(bookingId: number, userId: number, paymentCode: string, amount: number, method: PaymentMethod, referenceLabel: string) {
  db.prepare(`
    INSERT INTO payments (booking_id, user_id, payment_code, amount, method, status, reference_label)
    VALUES (?, ?, ?, ?, ?, 'PAID', ?)
  `).run(bookingId, userId, paymentCode, amount, method, referenceLabel);
}

export function getPaymentForBooking(bookingId: number): Payment | undefined {
  const row = db.prepare(`
    SELECT p.id, p.payment_code, b.booking_code, p.amount, p.method, p.status, p.reference_label, p.paid_at
    FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE p.booking_id = ?
  `).get(bookingId) as PaymentRow | undefined;
  return row ? toPayment(row) : undefined;
}

export function listPayments(userId: number): Payment[] {
  const rows = db.prepare(`
    SELECT p.id, p.payment_code, b.booking_code, p.amount, p.method, p.status, p.reference_label, p.paid_at,
      s.operator, s.source, s.destination
    FROM payments p
    JOIN bookings b ON b.id = p.booking_id
    JOIN services s ON s.id = b.service_id
    WHERE p.user_id = ?
    ORDER BY p.paid_at DESC, p.id DESC
  `).all(userId) as PaymentRow[];
  return rows.map(toPayment);
}
