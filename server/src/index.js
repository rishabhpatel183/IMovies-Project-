import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import theatreRoutes from './routes/theatres.js';
import showRoutes from './routes/shows.js';
import bookingRoutes from './routes/bookings.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for real-time seat locks
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, {
  cors: {
    origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('show:join', (showId) => {
    if (typeof showId === 'string' && showId.length < 100) {
      socket.join(`show:${showId}`);
    }
  });

  socket.on('disconnect', () => {});
});

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Rate limiting
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'iMovies API',
    time: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);

// Error Handlers
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`[iMovies API] Server listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('[iMovies API] Database connection failed:', err.message);
    process.exit(1);
  });
