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
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

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
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
    rating REAL DEFAULT 4.0,
    amenities TEXT,
    boarding_points TEXT,
    dropping_points TEXT
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
    user_id INTEGER REFERENCES users(id),
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

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_code TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL CHECK(amount > 0),
    method TEXT NOT NULL CHECK(method IN ('UPI', 'CARD', 'WALLET')),
    status TEXT NOT NULL CHECK(status IN ('PAID')) DEFAULT 'PAID',
    reference_label TEXT NOT NULL,
    paid_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_bookings_service_date_status
    ON bookings(service_id, travel_date, status);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_payments_user_paid_at ON payments(user_id, paid_at DESC);
`);

const bookingColumns = db.prepare('PRAGMA table_info(bookings)').all() as Array<{ name: string }>;
if (!bookingColumns.some((column) => column.name === 'user_id')) {
  db.exec('ALTER TABLE bookings ADD COLUMN user_id INTEGER REFERENCES users(id)');
}
db.exec('CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id)');

const serviceColumns = db.prepare('PRAGMA table_info(services)').all() as Array<{ name: string }>;
if (!serviceColumns.some((column) => column.name === 'rating')) {
  db.exec('ALTER TABLE services ADD COLUMN rating REAL DEFAULT 4.0');
}
if (!serviceColumns.some((column) => column.name === 'amenities')) {
  db.exec('ALTER TABLE services ADD COLUMN amenities TEXT');
}
if (!serviceColumns.some((column) => column.name === 'boarding_points')) {
  db.exec('ALTER TABLE services ADD COLUMN boarding_points TEXT');
}
if (!serviceColumns.some((column) => column.name === 'dropping_points')) {
  db.exec('ALTER TABLE services ADD COLUMN dropping_points TEXT');
}

// Seed dynamically or set default values if they are null for existing rows
db.exec(`
  UPDATE services SET
    rating = COALESCE(rating, 4.0 + (id % 10) * 0.1),
    amenities = COALESCE(amenities, CASE WHEN vehicle LIKE '%Sleeper%' THEN 'Wi-Fi, Charging Point, Water Bottle, Blanket' ELSE 'Charging Point, Water Bottle' END),
    boarding_points = COALESCE(boarding_points, source || ' Central Bus Stand, ' || source || ' Bypass Road'),
    dropping_points = COALESCE(dropping_points, destination || ' Central Plaza, ' || destination || ' Drop Circle')
  WHERE rating IS NULL OR amenities IS NULL OR boarding_points IS NULL OR dropping_points IS NULL
`);

type ServiceSeed = [string, string, string, string, string, string, number, number, string];

function seedDatabase() {
  const serviceCount = (db.prepare('SELECT COUNT(*) AS count FROM services').get() as { count: number }).count;
  const isFreshDatabase = serviceCount === 0;

  const services: ServiceSeed[] = [
    ['Aster Travels', 'AT 201', 'Chennai', 'Bangalore', '06:30', '12:15', 345, 899, 'AC Seater'],
    ['BlueLine Express', 'BL 118', 'Chennai', 'Bangalore', '09:00', '15:20', 380, 799, 'AC Sleeper'],
    ['Aster Travels', 'AT 202', 'Bangalore', 'Chennai', '07:15', '13:00', 345, 899, 'AC Seater'],
    ['Southbound', 'SB 472', 'Bangalore', 'Chennai', '21:30', '04:30', 420, 1099, 'AC Sleeper'],
    ['Deccan Link', 'DL 330', 'Hyderabad', 'Chennai', '20:45', '08:15', 690, 1299, 'AC Sleeper'],
    ['Coromandel Coach', 'CC 055', 'Chennai', 'Hyderabad', '19:30', '07:00', 690, 1249, 'AC Sleeper'],
    ['Kaveri Connect', 'KC 810', 'Chennai', 'Coimbatore', '06:00', '13:30', 450, 949, 'AC Seater'],
    ['Western Wheels', 'WW 291', 'Coimbatore', 'Chennai', '21:45', '05:15', 450, 1049, 'AC Sleeper'],
    ['Mysore Royale', 'MR 087', 'Bangalore', 'Mysore', '07:00', '10:15', 195, 549, 'AC Seater'],
    ['Mysore Royale', 'MR 088', 'Mysore', 'Bangalore', '18:15', '21:30', 195, 549, 'AC Seater'],
    ['Malabar Line', 'ML 510', 'Bangalore', 'Kochi', '21:00', '07:30', 630, 1199, 'AC Sleeper'],
    ['Malabar Line', 'ML 511', 'Kochi', 'Bangalore', '20:30', '07:00', 630, 1199, 'AC Sleeper'],
    ['Temple Trail', 'TT 651', 'Chennai', 'Madurai', '22:00', '06:30', 510, 999, 'AC Sleeper'],
    ['Temple Trail', 'TT 652', 'Madurai', 'Chennai', '08:15', '16:45', 510, 899, 'AC Seater'],
    ['Krishna Transit', 'KT 214', 'Hyderabad', 'Vijayawada', '07:30', '13:00', 330, 749, 'AC Seater'],
    ['Krishna Transit', 'KT 215', 'Vijayawada', 'Hyderabad', '18:30', '00:00', 330, 849, 'AC Sleeper'],
    ['Srinivasa Express', 'SE 902', 'Chennai', 'Tirupati', '06:45', '11:00', 255, 599, 'AC Seater'],
    ['Srinivasa Express', 'SE 903', 'Tirupati', 'Chennai', '17:30', '21:45', 255, 599, 'AC Seater'],
    ['Cauvery Coach', 'CA 340', 'Chennai', 'Trichy', '07:00', '12:30', 330, 699, 'AC Seater'],
    ['Cauvery Coach', 'CA 341', 'Trichy', 'Chennai', '17:00', '22:30', 330, 799, 'AC Sleeper'],
    ['Konkan Rider', 'KR 176', 'Mumbai', 'Pune', '08:00', '11:45', 225, 649, 'AC Seater'],
    ['Konkan Rider', 'KR 177', 'Pune', 'Mumbai', '18:30', '22:15', 225, 649, 'AC Seater'],
    ['Bay Connector', 'BC 460', 'Chennai', 'Pondicherry', '08:30', '12:00', 210, 449, 'AC Seater'],
    ['Bay Connector', 'BC 461', 'Pondicherry', 'Chennai', '17:30', '21:00', 210, 449, 'AC Seater'],
    ['Deccan Link', 'DL 640', 'Bangalore', 'Pune', '20:30', '06:45', 615, 1199, 'AC Sleeper'],
    ['Deccan Link', 'DL 641', 'Pune', 'Bangalore', '21:15', '07:30', 615, 1199, 'AC Sleeper'],
    ['Southbound', 'SB 624', 'Hyderabad', 'Bangalore', '21:00', '07:15', 615, 1149, 'AC Sleeper'],
    ['Southbound', 'SB 625', 'Bangalore', 'Hyderabad', '20:15', '06:30', 615, 1149, 'AC Sleeper'],
    ['Green Coast', 'GC 706', 'Kochi', 'Coimbatore', '08:00', '13:30', 330, 749, 'AC Seater'],
    ['Green Coast', 'GC 707', 'Coimbatore', 'Kochi', '17:00', '22:30', 330, 749, 'AC Seater'],
    ['Coromandel Coach', 'CC 216', 'Chennai', 'Bangalore', '22:15', '04:45', 390, 1099, 'AC Sleeper'],
    ['Aster Travels', 'AT 517', 'Bangalore', 'Chennai', '13:30', '19:15', 345, 849, 'AC Seater'],
    ['Hillway Transit', 'HT 370', 'Bangalore', 'Mangalore', '21:30', '07:00', 570, 1099, 'AC Sleeper'],
    ['Hillway Transit', 'HT 371', 'Mangalore', 'Bangalore', '20:45', '06:15', 570, 1099, 'AC Sleeper'],
    ['Coastal Express', 'CE 442', 'Hyderabad', 'Visakhapatnam', '20:00', '07:45', 705, 1299, 'AC Sleeper'],
    ['Coastal Express', 'CE 443', 'Visakhapatnam', 'Hyderabad', '19:15', '07:00', 705, 1299, 'AC Sleeper'],
    ['Golden Route', 'GR 120', 'Chennai', 'Vellore', '07:30', '10:45', 195, 449, 'AC Seater'],
    ['Golden Route', 'GR 121', 'Vellore', 'Chennai', '17:15', '20:30', 195, 449, 'AC Seater'],
    ['Temple Trail', 'TT 773', 'Coimbatore', 'Madurai', '08:15', '13:30', 315, 699, 'AC Seater'],
    ['Temple Trail', 'TT 774', 'Madurai', 'Coimbatore', '17:30', '22:45', 315, 699, 'AC Seater'],
    ['Sahyadri Lines', 'SL 250', 'Pune', 'Goa', '21:00', '08:30', 690, 1349, 'AC Sleeper'],
    ['Sahyadri Lines', 'SL 251', 'Goa', 'Pune', '20:15', '07:45', 690, 1349, 'AC Sleeper'],
    ['Nilgiri Coach', 'NC 412', 'Bangalore', 'Ooty', '06:30', '13:00', 390, 899, 'AC Seater'],
    ['Nilgiri Coach', 'NC 413', 'Ooty', 'Bangalore', '14:30', '21:00', 390, 899, 'AC Seater'],
    ['Cape Connect', 'CP 980', 'Chennai', 'Kanyakumari', '19:00', '07:30', 750, 1399, 'AC Sleeper'],
    ['Cape Connect', 'CP 981', 'Kanyakumari', 'Chennai', '18:30', '07:00', 750, 1399, 'AC Sleeper'],
    ['Deccan Link', 'DL 821', 'Hyderabad', 'Pune', '21:45', '07:45', 600, 1199, 'AC Sleeper'],
    ['Deccan Link', 'DL 822', 'Pune', 'Hyderabad', '20:30', '06:30', 600, 1199, 'AC Sleeper'],
    ['Western Wheels', 'WW 520', 'Mumbai', 'Goa', '22:00', '08:45', 645, 1399, 'AC Sleeper'],
    ['Western Wheels', 'WW 521', 'Goa', 'Mumbai', '21:15', '08:00', 645, 1399, 'AC Sleeper'],
    ['Southbound', 'SB 704', 'Bangalore', 'Chennai', '16:30', '22:15', 345, 849, 'AC Seater'],
    ['Aster Travels', 'AT 705', 'Chennai', 'Bangalore', '14:15', '20:00', 345, 849, 'AC Seater'],
    
    // Additional premium buses
    ['VRL Travels', 'VL 301', 'Mumbai', 'Goa', '18:00', '06:30', 750, 1499, 'AC Sleeper'],
    ['KSRTC', 'KS 102', 'Bangalore', 'Mysore', '09:30', '12:45', 195, 499, 'AC Seater'],
    ['SRS Travels', 'SR 405', 'Bangalore', 'Hyderabad', '21:30', '07:00', 570, 1099, 'AC Sleeper'],
    ['BlueLine Express', 'BL 506', 'Hyderabad', 'Bangalore', '22:00', '07:30', 570, 1149, 'AC Sleeper'],
    ['Zingbus', 'ZB 801', 'Pune', 'Mumbai', '06:00', '09:30', 210, 549, 'AC Seater'],
    ['Zingbus', 'ZB 802', 'Mumbai', 'Pune', '16:00', '19:30', 210, 599, 'AC Seater'],
    ['National Travels', 'NT 901', 'Hyderabad', 'Chennai', '19:00', '06:30', 690, 1199, 'AC Sleeper'],
    ['National Travels', 'NT 902', 'Chennai', 'Hyderabad', '20:00', '07:30', 690, 1199, 'AC Sleeper'],
    ['Parveen Travels', 'PT 701', 'Chennai', 'Madurai', '21:00', '05:30', 510, 899, 'AC Sleeper'],
    ['Parveen Travels', 'PT 702', 'Madurai', 'Chennai', '22:30', '07:00', 510, 899, 'AC Sleeper'],
    ['IntrCity SmartBus', 'IC 113', 'Bangalore', 'Chennai', '15:00', '21:30', 390, 949, 'AC Sleeper'],
    ['KSRTC Swarna', 'KS 789', 'Bangalore', 'Mangalore', '22:30', '07:30', 540, 999, 'AC Sleeper'],
    ['Orange Tours', 'OT 555', 'Hyderabad', 'Visakhapatnam', '18:45', '06:15', 690, 1399, 'AC Sleeper'],
    ['Orange Tours', 'OT 556', 'Visakhapatnam', 'Hyderabad', '19:45', '07:15', 690, 1399, 'AC Sleeper'],

    // Additional popular routes premium buses
    ['VRL Travels', 'VL 302', 'Goa', 'Mumbai', '19:00', '07:30', 750, 1499, 'AC Sleeper'],
    ['KSRTC', 'KS 103', 'Mysore', 'Bangalore', '14:30', '17:45', 195, 499, 'AC Seater'],
    ['KSRTC Airavat', 'KA 401', 'Bangalore', 'Hyderabad', '13:00', '21:30', 510, 999, 'AC Seater'],
    ['KSRTC Airavat', 'KA 402', 'Hyderabad', 'Bangalore', '14:00', '22:30', 510, 999, 'AC Seater'],
    ['Jabbar Travels', 'JT 881', 'Bangalore', 'Hyderabad', '22:15', '07:45', 570, 1199, 'AC Sleeper'],
    ['Jabbar Travels', 'JT 882', 'Hyderabad', 'Bangalore', '21:45', '07:15', 570, 1199, 'AC Sleeper'],
    ['SRS Travels', 'SR 406', 'Hyderabad', 'Bangalore', '20:30', '06:00', 570, 1099, 'AC Sleeper'],
    ['Zingbus', 'ZB 803', 'Mumbai', 'Pune', '08:30', '12:00', 210, 549, 'AC Seater'],
    ['Zingbus', 'ZB 804', 'Pune', 'Mumbai', '14:30', '18:00', 210, 549, 'AC Seater'],
    ['Neeta Travels', 'NT 551', 'Mumbai', 'Pune', '10:00', '13:30', 210, 590, 'AC Seater'],
    ['Neeta Travels', 'NT 552', 'Pune', 'Mumbai', '17:00', '20:30', 210, 590, 'AC Seater'],
    ['Orange Tours', 'OT 121', 'Mumbai', 'Goa', '17:00', '05:30', 750, 1549, 'AC Sleeper'],
    ['Orange Tours', 'OT 122', 'Goa', 'Mumbai', '18:30', '07:00', 750, 1549, 'AC Sleeper'],
    ['Atmaram Travels', 'AM 991', 'Mumbai', 'Goa', '19:30', '08:00', 750, 1450, 'AC Sleeper'],
    ['Atmaram Travels', 'AM 992', 'Goa', 'Mumbai', '20:00', '08:30', 750, 1450, 'AC Sleeper'],
    ['IntrCity SmartBus', 'IC 221', 'Mumbai', 'Goa', '20:30', '09:00', 750, 1599, 'AC Sleeper'],
    ['Paulo Travels', 'PT 331', 'Pune', 'Goa', '19:45', '07:00', 675, 1299, 'AC Sleeper'],
    ['Paulo Travels', 'PT 332', 'Goa', 'Pune', '20:30', '07:45', 675, 1299, 'AC Sleeper'],
    ['Zingbus', 'ZB 771', 'Pune', 'Goa', '21:30', '08:45', 675, 1199, 'AC Sleeper'],
    ['Zingbus', 'ZB 772', 'Goa', 'Pune', '21:00', '08:15', 675, 1199, 'AC Sleeper'],
    ['Parveen Travels', 'PV 441', 'Chennai', 'Coimbatore', '10:00', '18:00', 480, 899, 'AC Seater'],
    ['Parveen Travels', 'PV 442', 'Coimbatore', 'Chennai', '13:00', '21:00', 480, 899, 'AC Seater'],
    ['No 1 Air Travels', 'NO 101', 'Chennai', 'Coimbatore', '21:30', '05:30', 480, 1099, 'AC Sleeper'],
    ['No 1 Air Travels', 'NO 102', 'Coimbatore', 'Chennai', '22:00', '06:00', 480, 1099, 'AC Sleeper']
  ];

  const insertService = db.prepare(`
    INSERT OR IGNORE INTO services (operator, service_code, source, destination, departure_time, arrival_time, duration_minutes, price, vehicle, rating, amenities, boarding_points, dropping_points)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSeat = db.prepare(`
    INSERT OR IGNORE INTO seats (service_id, seat_number, row_number, column_number) VALUES (?, ?, ?, ?)
  `);

  const seed = db.transaction(() => {
    for (const service of services) {
      const [operator, serviceCode, source, destination, departureTime, arrivalTime, durationMinutes, price, vehicle] = service;
      
      const rating = parseFloat((4.0 + (serviceCode.charCodeAt(serviceCode.length - 1) % 10) * 0.1).toFixed(1));
      
      const amenitiesList = vehicle.includes('Sleeper')
        ? 'Wi-Fi, Charging Point, Pillow, Blanket, Water Bottle'
        : 'Charging Point, Reading Light, Water Bottle';
        
      const boardingPoints = `${source} Bus Station, ${source} Bypass, ${source} Toll Plaza`;
      const droppingPoints = `${destination} Bus Stand, ${destination} Center, ${destination} Drop Circle`;

      const result = insertService.run(
        operator, serviceCode, source, destination, departureTime, arrivalTime, durationMinutes, price, vehicle,
        rating, amenitiesList, boardingPoints, droppingPoints
      );
      if (result.changes === 0) continue;
      const serviceId = Number(result.lastInsertRowid);
      for (let row = 1; row <= 10; row += 1) {
        for (let column = 1; column <= 4; column += 1) {
          insertSeat.run(serviceId, `${row}${String.fromCharCode(64 + column)}`, row, column);
        }
      }
    }

    const citiesList = [
      'Bangalore', 'Chennai', 'Coimbatore', 'Delhi', 'Goa', 'Hyderabad',
      'Kanyakumari', 'Kochi', 'Madurai', 'Mangalore', 'Mumbai', 'Mysore',
      'Ooty', 'Pondicherry', 'Pune', 'Tirupati', 'Trichy', 'Vellore',
      'Vijayawada', 'Visakhapatnam'
    ];
    const operators = ['VRL Travels', 'Zingbus', 'IntrCity SmartBus', 'Orange Tours', 'SRS Travels', 'National Travels', 'Paulo Travels', 'Parveen Travels'];

    for (const source of citiesList) {
      for (const destination of citiesList) {
        if (source === destination) continue;
        if (source === 'Chennai' && destination === 'Bangalore') continue;

        const charSum = source.charCodeAt(0) + destination.charCodeAt(0);
        const opIndex = charSum % operators.length;
        const operator1 = operators[opIndex];
        const operator2 = operators[(opIndex + 3) % operators.length];

        const duration = 180 + (charSum % 8) * 60;
        const price1 = 499 + (charSum % 6) * 150;
        const price2 = price1 + 250;

        const code1 = `DY-${100 + (charSum * 3) % 899}`;
        const result1 = insertService.run(
          operator1, code1, source, destination, '08:00', '14:30', duration, price1, 'AC Seater',
          4.2, 'Charging Point, Reading Light, Water Bottle',
          `${source} Bus Station, ${source} Bypass`,
          `${destination} Bus Stand, ${destination} Drop Circle`
        );
        if (result1.changes > 0) {
          const serviceId = Number(result1.lastInsertRowid);
          for (let row = 1; row <= 10; row += 1) {
            for (let column = 1; column <= 4; column += 1) {
              insertSeat.run(serviceId, `${row}${String.fromCharCode(64 + column)}`, row, column);
            }
          }
        }

        const code2 = `DY-${200 + (charSum * 7) % 899}`;
        const result2 = insertService.run(
          operator2, code2, source, destination, '21:30', '05:00', duration + 60, price2, 'AC Sleeper',
          4.5, 'Wi-Fi, Charging Point, Pillow, Blanket, Water Bottle',
          `${source} Toll Plaza, ${source} Bus Station`,
          `${destination} Center, ${destination} Bus Stand`
        );
        if (result2.changes > 0) {
          const serviceId = Number(result2.lastInsertRowid);
          for (let row = 1; row <= 10; row += 1) {
            for (let column = 1; column <= 4; column += 1) {
              insertSeat.run(serviceId, `${row}${String.fromCharCode(64 + column)}`, row, column);
            }
          }
        }
      }
    }

    if (isFreshDatabase) {
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
    }
  });

  seed();
}

seedDatabase();
