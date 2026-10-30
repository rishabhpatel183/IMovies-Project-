import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from server/.env or root .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import theatreRoutes from './routes/theatres.js';
import showRoutes from './routes/shows.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS (Vercel deployment, local dev, env var)
const allowedOrigins = [
  'https://i-movies-project.vercel.app',
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
].filter(Boolean);

// CORS configuration that allows Vercel, localhost, and reflects valid origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    // Reflect origin to avoid blocking valid clients
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Initialize Socket.IO for real-time seat locks
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true,
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

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Rate limiting (more generous for multi-user frontend traffic)
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health check
app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI || '';
  res.json({
    status: 'ok',
    service: 'iMovies API',
    database: {
      status: states[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
      hasMongoUri: Boolean(rawUri),
      uriPreview: rawUri ? rawUri.replace(/:([^@]+)@/, ':****@') : 'NONE_PROVIDED',
    },
    time: new Date().toISOString(),
  });
});

// Diagnostic endpoint to test direct MongoDB connection and reconnect if needed
app.get('/api/db-test', async (req, res) => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    return res.status(500).json({ error: 'MONGO_URI is not set in environment variables' });
  }
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    }
    const count = await mongoose.connection.collection('movies').countDocuments();
    res.json({
      success: true,
      moviesCount: count,
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      errorName: err.name,
      errorMessage: err.message,
      reason: err.reason || null,
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Error Handlers
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

// Connect to MongoDB and start listening
connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`[iMovies API] Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('[iMovies API] Database connection failed:', err.message);
    // Still bind the port on Render so container doesn't immediately crash and returns diagnostics
    server.listen(port, () => {
      console.warn(`[iMovies API] Running in degraded mode on port ${port} without DB connection.`);
    });
  });
