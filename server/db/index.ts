import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDirectory = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDirectory, { recursive: true });

const databasePath = process.env.TICKETFLOW_DB_PATH ?? path.join(dataDirectory, 'ticketflow.db');
export const db = new Database(databasePath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY,
    operator TEXT NOT NULL,
    service_code TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK(duration_minutes > 0),
    price INTEGER NOT NULL CHECK(price > 0),
    vehicle TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1))
  );

  CREATE TABLE IF NOT EXISTS seats (
    id INTEGER PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    seat_number TEXT NOT NULL,
    row_number INTEGER NOT NULL,
    column_number INTEGER NOT NULL,
    UNIQUE(service_id, seat_number)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY,
    booking_code TEXT NOT NULL UNIQUE,
    service_id INTEGER NOT NULL REFERENCES services(id),
    travel_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('CONFIRMED', 'CANCELLED')) DEFAULT 'CONFIRMED',
    total_amount INTEGER NOT NULL CHECK(total_amount > 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS passengers (
    id INTEGER PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK(age BETWEEN 1 AND 120),
    gender TEXT NOT NULL CHECK(gender IN ('Female', 'Male', 'Other'))
  );

  CREATE TABLE IF NOT EXISTS booking_seats (
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id INTEGER NOT NULL REFERENCES seats(id),
    passenger_id INTEGER NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
    PRIMARY KEY (booking_id, seat_id),
    UNIQUE(booking_id, passenger_id)
  );

  CREATE INDEX IF NOT EXISTS idx_bookings_service_date_status
    ON bookings(service_id, travel_date, status);
`);

type ServiceSeed = [string, string, string, string, string, string, number, number, string];

function seedDatabase() {
  const serviceCount = (db.prepare('SELECT COUNT(*) AS count FROM services').get() as { count: number }).count;
  if (serviceCount > 0) return;

  const services: ServiceSeed[] = [
    ['Aster Travels', 'AT 201', 'Chennai', 'Bangalore', '06:30', '12:15', 345, 899, 'AC Seater'],
    ['BlueLine Express', 'BL 118', 'Chennai', 'Bangalore', '09:00', '15:20', 380, 799, 'AC Sleeper'],
    ['Aster Travels', 'AT 202', 'Bangalore', 'Chennai', '07:15', '13:00', 345, 899, 'AC Seater'],
    ['Southbound', 'SB 472', 'Bangalore', 'Chennai', '21:30', '04:30', 420, 1099, 'AC Sleeper'],
    ['Deccan Link', 'DL 330', 'Hyderabad', 'Chennai', '20:45', '08:15', 690, 1299, 'AC Sleeper'],
    ['Coromandel Coach', 'CC 055', 'Chennai', 'Hyderabad', '19:30', '07:00', 690, 1249, 'AC Sleeper'],
  ];
  const insertService = db.prepare(`
    INSERT INTO services (operator, service_code, source, destination, departure_time, arrival_time, duration_minutes, price, vehicle)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSeat = db.prepare(`
    INSERT INTO seats (service_id, seat_number, row_number, column_number) VALUES (?, ?, ?, ?)
  `);

  const seed = db.transaction(() => {
    for (const service of services) {
      const result = insertService.run(...service);
      const serviceId = Number(result.lastInsertRowid);
      for (let row = 1; row <= 10; row += 1) {
        for (let column = 1; column <= 4; column += 1) {
          insertSeat.run(serviceId, `${row}${String.fromCharCode(64 + column)}`, row, column);
        }
      }
    }

    const date = new Date().toISOString().slice(0, 10);
    const firstService = db.prepare("SELECT id, price FROM services WHERE service_code = 'AT 201'").get() as { id: number; price: number };
    const booking = db.prepare(`
      INSERT INTO bookings (booking_code, service_id, travel_date, total_amount) VALUES (?, ?, ?, ?)
    `).run('TF-SEED-0001', firstService.id, date, firstService.price * 2);
    const bookingId = Number(booking.lastInsertRowid);
    const insertPassenger = db.prepare('INSERT INTO passengers (booking_id, full_name, age, gender) VALUES (?, ?, ?, ?)');
    const insertBookingSeat = db.prepare('INSERT INTO booking_seats (booking_id, seat_id, passenger_id) VALUES (?, ?, ?)');
    for (const [name, age, gender, seatNumber] of [['Nila Kumar', 27, 'Female', '1A'], ['Arun Das', 30, 'Male', '1B']] as const) {
      const passenger = insertPassenger.run(bookingId, name, age, gender);
      const seat = db.prepare('SELECT id FROM seats WHERE service_id = ? AND seat_number = ?').get(firstService.id, seatNumber) as { id: number };
      insertBookingSeat.run(bookingId, seat.id, Number(passenger.lastInsertRowid));
    }
  });

  seed();
}

seedDatabase();
