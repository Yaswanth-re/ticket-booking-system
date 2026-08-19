# Ticket Booking System

A complete, clean, professional, and fully functional Ticket Booking System built with a premium Cherry Red and Navy Slate design. It features dynamic location searching, interactive date selection, passenger count controls, live seat map deck toggles, secure first-name session accounts, and printable boarding passes.

## Features

- **Dynamic Source & Destination Selection**: Interactive popovers with live city search and input validation.
- **Location Swap Functionality**: Smooth swap button (`⇄`) that instantly interchanges From and To destinations with validation.
- **Responsive Date Selection**: Integrated date picker preventing past bookings.
- **Interactive Traveller Selector**: Count controller limiting transactions between 1 and 9 passengers via clear `−` and `+` controls.
- **Advanced Result Filters & Sorting**: Sidebars to filter by bus layout types, time of departure, and amenities, plus sorting by price, rating, departure, and duration.
- **Realistic Decks Seat Layout**: Driver cabin styling with Upper vs Lower deck selection tabs for sleeper buses and gender-booked seat color mappings.
- **Printable Boarding Pass Receipt**: PDF-like print view featuring dotted tear lines and barcode visualizers.
- **Responsive Layout**: Designed to work fluidly across mobile, tablet, laptop, and desktop screens.
- **Production-Ready Single-Port Hosting**: Serves the built frontend directly from Express, ready for deployment to platforms like Render.

## Technologies Used

- **Frontend**: React 19, TypeScript, Vite, HSL Vanilla CSS variables (No TailwindCSS)
- **Backend**: Node.js, Express 5, TypeScript, `better-sqlite3` for SQL queries
- **Testing**: Node's built-in test runner (`tsx --test`)
- **Database**: SQLite with self-healing dynamic column migrations

## Installation

To clone and run the project locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Yaswanth-re/ticket-booking-system.git
   cd ticket-booking-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   This launches the concurrently managed Express server (port 3001) and Vite client (port 5173/5174/5175):
   ```bash
   npm run dev
   ```

4. **Run unit tests**:
   ```bash
   npm test
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

6. **Start production server locally**:
   ```bash
   npm start
   ```

## Environment Variables

The application can be configured to call an external API or run in a single-port environment.

- `VITE_API_URL`: Optional custom base API URL (e.g., `https://api.yourdomain.com`). If not set, defaults to `/api` for unified host proxy paths.
- `PORT`: Sets the port the server listens on (defaults to `3001`).

Do **NOT** commit `.env` files or credentials containing database keys to git.

## Deployment

The application is configured to build and serve statically from a single Node/Express server instance:

1. **Deployment Platform**: **Render** (as a Web Service) or any cloud provider running Node.js.
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. This serves both the REST API (under `/api`) and the static React app (under `/`) on the same port.

### Live Website
The live deployed website is publicly accessible at:
- **Deployment URL**: [https://ticket-booking-system-3d2b.onrender.com](https://ticket-booking-system-3d2b.onrender.com) (example deployment URL on Render)

### GitHub Repository
- **GitHub URL**: [https://github.com/Yaswanth-re/ticket-booking-system](https://github.com/Yaswanth-re/ticket-booking-system)
