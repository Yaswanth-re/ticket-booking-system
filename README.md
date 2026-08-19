# TicketFlow

TicketFlow is a full-stack intercity ticket-booking application built for a placement technical evaluation. It demonstrates a complete reservation journey: search a route, inspect a service, select live seats, add passenger details, review, confirm, and manage bookings.

## Problem statement

Booking seats is deceptively stateful: a seat shown as available must still be checked when the customer confirms. TicketFlow keeps the source of truth on the server and uses a SQLite transaction to prevent a stale client from reserving an already-booked seat.

## Features

- Search daily Chennai, Bangalore, and Hyderabad routes by date and passenger count
- Service details with departure, arrival, duration, price, and current availability
- Live seat map with available, selected, and booked states
- Passenger validation for name, age, gender, and seat/passenger count
- Booking review and generated references in the `TF-YYYY-XXXXXX` format
- Persisted booking history, booking details, and cancellation
- Cancellation updates the record to `CANCELLED` and releases its seats
- Responsive interface for desktop and mobile
- Useful loading, empty, validation, conflict, and server-error states

## Tech stack

- React 19, TypeScript, Vite
- Node.js, Express 5, TypeScript
- SQLite through `better-sqlite3`
- Node’s built-in test runner

## Architecture

```text
React UI → REST API routes → controllers → booking service → repositories → SQLite
```

The service layer owns booking validation and the database transaction. Repositories contain the SQL access. The frontend never decides whether a seat is actually available.

## Database design

| Table | Purpose |
| --- | --- |
| `services` | Daily intercity service details and fare |
| `seats` | Seat template for each service |
| `bookings` | Booking reference, service, date, status, and total |
| `passengers` | Passenger details belonging to a booking |
| `booking_seats` | One seat-to-one-passenger assignment inside a booking |

Foreign keys, unique seat mappings, age constraints, and booking-status constraints are enabled. Availability is calculated by excluding seats in `CONFIRMED` bookings for the selected service and travel date.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/tickets?source=&destination=&date=` | Search services |
| `GET` | `/api/tickets/:id?date=` | Get a service and current availability |
| `GET` | `/api/tickets/:id/seats?date=` | Get the live seat map |
| `POST` | `/api/bookings` | Create a confirmed booking |
| `GET` | `/api/bookings` | List persisted bookings |
| `GET` | `/api/bookings/:id` | Get booking details by booking reference |
| `PATCH` | `/api/bookings/:id/cancel` | Cancel a confirmed booking and release seats |

Example booking request:

```json
{
  "ticketId": 1,
  "travelDate": "2026-08-19",
  "seats": ["2A"],
  "passengers": [{ "fullName": "Asha Kumar", "age": 24, "gender": "Female" }]
}
```

## Booking safety

On confirmation, the server validates the service, travel date, seat numbers, passenger details, and one-to-one seat/passenger count. It then starts a SQLite transaction, re-checks all requested seats against current confirmed bookings, inserts the booking and passengers, and assigns the seats. A stale request for an already reserved seat returns HTTP `409 Conflict`.

## Project structure

```text
src/                         React UI, components, styles, API client
server/
  controllers/               HTTP input/output handling
  services/                  Booking validation and transaction logic
  repositories/              SQLite queries
  routes/                    REST endpoint definitions
  db/                        Schema creation and realistic seed data
public/                      Static browser assets
```

## Run locally

Prerequisites: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Vite serves the frontend and proxies `/api` calls to the Express API at `http://localhost:3001`.

The application creates `data/ticketflow.db` automatically on first run. It is local runtime data and is intentionally ignored by Git—no environment variables, keys, or database setup are needed.

## Scripts

```bash
npm run dev      # start client and API together
npm run build    # type-check and make a production frontend build
npm test         # API integration test
```

## Tests performed

`npm test` runs an isolated API integration test with a temporary SQLite database. It verifies:

1. route search and seeded booked-seat state;
2. booking creation and persistence;
3. generated booking-reference format;
4. double-booking prevention with HTTP `409`;
5. cancellation; and
6. rebooking after cancelled seats are released.

## Screenshots

The responsive home, search-results, seat-selection, passenger, review, confirmation, and booking-history screens can be viewed locally with `npm run dev`. Screenshots are intentionally not committed to keep the submission source-focused.

## Design decisions

- SQLite is intentionally chosen for a zero-configuration, locally evaluable persistence layer.
- Services run daily; availability is determined by service plus travel date, not a frontend counter.
- There is no payment integration: confirmation directly reserves seats and the UI explicitly states this. This avoids a fake payment flow.
- Authentication is outside the scope of this compact assignment. `My bookings` displays the local booking history so the full lifecycle remains testable without credentials.

## Future improvements

- Add user authentication and user-scoped booking history
- Add boarding and drop-off points
- Add payment-provider integration and asynchronous payment status
- Add SQL migration tooling, request logging, and broader UI test coverage
- Add date-specific service calendars and operator administration
