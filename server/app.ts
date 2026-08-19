import express from 'express';
import { AppError } from './errors.js';
import { bookingsRouter } from './routes/bookings.js';
import { ticketsRouter } from './routes/tickets.js';

export const app = express();
app.use(express.json({ limit: '32kb' }));
app.use('/api/tickets', ticketsRouter);
app.use('/api/bookings', bookingsRouter);

app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: 'Something went wrong. Please try again.' });
});
