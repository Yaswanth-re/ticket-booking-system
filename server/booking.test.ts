import assert from 'node:assert/strict';
import { once } from 'node:events';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const testDatabase = path.join(tmpdir(), `ticketflow-${process.pid}.db`);
process.env.TICKETFLOW_DB_PATH = testDatabase;

const { app } = await import('./app.js');
const { db } = await import('./db/index.js');
const server = app.listen(0);
await once(server, 'listening');
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Test server did not start.');
const baseUrl = `http://127.0.0.1:${address.port}/api`;
const travelDate = new Date().toISOString().slice(0, 10);

async function api(pathname: string, init?: RequestInit, session?: string) {
  return fetch(`${baseUrl}${pathname}`, {
    headers: { 'Content-Type': 'application/json', ...(session ? { Cookie: session } : {}), ...init?.headers },
    ...init,
  });
}

async function signUp(fullName: string, email: string) {
  const response = await api('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password: 'TicketFlow123' }),
  });
  assert.equal(response.status, 201);
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie);
  return cookie;
}

async function logIn(email: string) {
  const response = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'TicketFlow123' }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie);
  return cookie;
}

test('account bookings persist privately, prevent conflicts, and release cancelled seats', async (t) => {
  t.after(() => {
    server.close();
    db.close();
    rmSync(testDatabase, { force: true });
    rmSync(`${testDatabase}-wal`, { force: true });
    rmSync(`${testDatabase}-shm`, { force: true });
  });

  const search = await api(`/tickets?source=Chennai&destination=Bangalore&date=${travelDate}`);
  assert.equal(search.status, 200);
  const searchBody = await search.json() as { tickets: Array<{ id: number }> };
  assert.equal(searchBody.tickets.length, 2);

  const signedOutState = await api('/auth/me');
  assert.equal(signedOutState.status, 200);
  assert.equal((await signedOutState.json() as { user: unknown }).user, null);

  const email = `test-${process.pid}@ticketflow.dev`;
  const createdSession = await signUp('Test Traveller', email);
  const currentUser = await api('/auth/me', undefined, createdSession);
  assert.equal((await currentUser.json() as { user: { email: string } }).user.email, email);

  const logout = await api('/auth/logout', { method: 'POST' }, createdSession);
  assert.equal(logout.status, 204);
  const session = await logIn(email);
  const unauthenticatedBookings = await api('/bookings');
  assert.equal(unauthenticatedBookings.status, 401);

  const seats = await api(`/tickets/1/seats?date=${travelDate}`);
  const seatBody = await seats.json() as { seats: Array<{ number: string; status: string }> };
  assert.equal(seatBody.seats.find((seat) => seat.number === '1A')?.status, 'BOOKED');

  const body = JSON.stringify({
    ticketId: 1,
    travelDate,
    seats: ['2A'],
    passengers: [{ fullName: 'Test Traveller', age: 24, gender: 'Other' }],
  });
  const created = await api('/bookings', { method: 'POST', body }, session);
  assert.equal(created.status, 201);
  const createdBody = await created.json() as { booking: { bookingCode: string; status: string; seats: string[] } };
  assert.match(createdBody.booking.bookingCode, /^TF-\d{4}-[A-F0-9]{6}$/);
  assert.equal(createdBody.booking.status, 'CONFIRMED');
  assert.deepEqual(createdBody.booking.seats, ['2A']);

  const conflict = await api('/bookings', { method: 'POST', body }, session);
  assert.equal(conflict.status, 409);

  const otherSession = await signUp('Other Traveller', `other-${process.pid}@ticketflow.dev`);
  const privateBooking = await api(`/bookings/${createdBody.booking.bookingCode}`, undefined, otherSession);
  assert.equal(privateBooking.status, 404);

  const cancelled = await api(`/bookings/${createdBody.booking.bookingCode}/cancel`, { method: 'PATCH' }, session);
  assert.equal(cancelled.status, 200);
  assert.equal((await cancelled.json() as { booking: { status: string } }).booking.status, 'CANCELLED');

  const rebooked = await api('/bookings', { method: 'POST', body: JSON.stringify({
    ticketId: 1,
    travelDate,
    seats: ['2A'],
    passengers: [{ fullName: 'Second Traveller', age: 29, gender: 'Male' }],
  }) }, session);
  assert.equal(rebooked.status, 201);

  const mine = await api('/bookings', undefined, session);
  assert.equal((await mine.json() as { bookings: unknown[] }).bookings.length, 2);
});
