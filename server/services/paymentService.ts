import { AppError } from '../errors.js';
import { listPayments } from '../repositories/paymentRepository.js';
import type { PaymentInput, PaymentMethod } from '../types.js';

const allowedMethods: PaymentMethod[] = ['UPI', 'CARD', 'WALLET'];

export function validatePayment(input: unknown): { method: PaymentMethod; referenceLabel: string } {
  if (!input || typeof input !== 'object') throw new AppError('Choose a payment method.');
  const { method, reference } = input as Partial<PaymentInput>;
  if (!allowedMethods.includes(method as PaymentMethod) || typeof reference !== 'string') throw new AppError('Choose a valid payment method.');

  const value = reference.trim();
  if (method === 'UPI') {
    if (!/^[A-Za-z0-9._-]{2,64}@[A-Za-z]{2,32}$/.test(value)) throw new AppError('Enter a valid UPI ID, for example name@bank.');
    return { method: method as PaymentMethod, referenceLabel: value.toLowerCase() };
  }
  if (method === 'CARD') {
    if (!/^\d{4}$/.test(value)) throw new AppError('Enter the last four digits of your card.');
    return { method: method as PaymentMethod, referenceLabel: `Card ending ${value}` };
  }
  if (!/^[A-Za-z0-9._-]{3,32}$/.test(value)) throw new AppError('Enter a valid wallet handle.');
  return { method: method as PaymentMethod, referenceLabel: value };
}

export function getAllPayments(userId: number) {
  return listPayments(userId);
}
