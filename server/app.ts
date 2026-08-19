import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from './errors.js';
import { authRouter } from './routes/auth.js';
import { bookingsRouter } from './routes/bookings.js';
import { paymentsRouter } from './routes/payments.js';
import { ticketsRouter } from './routes/tickets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.use(express.json({ limit: '32kb' }));
app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.use('/api', (_req, res) => res.status(404).json({ message: 'Route not found.' }));

app.get('/*path', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: 'Something went wrong. Please try again.' });
});
