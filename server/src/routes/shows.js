import { Router } from 'express';
import mongoose from 'mongoose';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import Theatre from '../models/Theatre.js';
import Booking from '../models/Booking.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const io = (req) => req.app.get('io');

// Helper to auto-expire stale seat holds (default: 5 minutes)
export const cleanExpired = (show) => {
  const now = new Date();
  let modified = false;
  for (const s of show.seats) {
    if (s.status === 'held' && s.holdExpiresAt && s.holdExpiresAt <= now) {
      s.status = 'available';
      s.heldBy = null;
      s.holdExpiresAt = null;
      modified = true;
    }
  }
  return modified;
};

// Generate seat codes like A1..A8, B1..B8
export function seatCodes(rows, cols) {
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => ({
      code: `${String.fromCharCode(65 + i)}${j + 1}`,
      status: 'available',
      heldBy: null,
      holdExpiresAt: null,
      bookingId: null,
    }))
  ).flat();
}

// GET /api/shows - List shows matching movie, theatre, date
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = { active: true, startsAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } };

    if (req.query.movieId) query.movie = req.query.movieId;
    if (req.query.theatreId) query.theatre = req.query.theatreId;

    if (req.query.date) {
      const d = new Date(req.query.date);
      if (!Number.isNaN(+d)) {
        const start = new Date(d.setHours(0, 0, 0, 0));
        const end = new Date(d.setHours(23, 59, 59, 999));
        query.startsAt = { $gte: start, $lte: end };
      }
    }

    const shows = await Show.find(query)
      .populate('movie', 'title posterUrl durationMinutes languages genres certificate director producers cast')
      .populate('theatre', 'name location city address screens facilities')
      .sort({ startsAt: 1 })
      .limit(150);

    res.json(shows);
  })
);

// POST /api/shows - Admin: Schedule show
router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const {
      movie,
      theatre,
      startsAt,
      endsAt,
      price,
      screen = 'Screen 1',
      rows = 6,
      cols = 8,
    } = req.body;

    const [movieDoc, theatreDoc] = await Promise.all([
      Movie.findOne({ _id: movie, active: true }),
      Theatre.findOne({ _id: theatre, active: true }),
    ]);

    if (!movieDoc || !theatreDoc) {
      return res.status(400).json({ message: 'Choose an active movie and theatre' });
    }

    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : new Date(start.getTime() + (movieDoc.durationMinutes + 30) * 60000);

    if (Number.isNaN(+start) || !Number.isFinite(Number(price)) || price < 0) {
      return res.status(400).json({ message: 'Valid show date, time, and price required' });
    }

    const rCount = Math.min(15, Math.max(1, parseInt(rows) || 6));
    const cCount = Math.min(20, Math.max(1, parseInt(cols) || 8));

    const show = await Show.create({
      movie,
      theatre,
      startsAt: start,
      endsAt: end,
      price: Number(price),
      screen,
      seatLayout: { rows: rCount, cols: cCount },
      seats: seatCodes(rCount, cCount),
    });

    res.status(201).json(show);
  })
);

// GET /api/shows/:id/seats - Get seat layout & statuses
router.get(
  '/:id/seats',
  asyncHandler(async (req, res) => {
    const show = await Show.findById(req.params.id)
      .select('seats seatLayout price startsAt screen theatre movie')
      .populate('theatre', 'name location city address screens facilities')
      .populate('movie', 'title durationMinutes certificate director producers cast');

    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }

    const modified = cleanExpired(show);
    if (modified) {
      await show.save();
    }

    res.json({
      showId: show._id,
      price: show.price,
      screen: show.screen,
      theatre: show.theatre,
      movie: show.movie,
      startsAt: show.startsAt,
      seatLayout: show.seatLayout || { rows: 6, cols: 8 },
      seats: show.seats.map((s) => ({
        code: s.code,
        status: s.status === 'held' && String(s.heldBy) !== String(req.user?._id) ? 'held' : s.status,
        expiresAt: s.holdExpiresAt,
      })),
    });
  })
);

// POST /api/shows/:id/hold - Hold seats for 5 minutes
router.post(
  '/:id/hold',
  protect,
  asyncHandler(async (req, res) => {
    const codes = [...new Set((req.body.seats || []).map(String))];

    if (!codes.length || codes.length > 8) {
      return res.status(400).json({ message: 'Select between 1 and 8 seats' });
    }

    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }

    cleanExpired(show);

    const selected = show.seats.filter((s) => codes.includes(s.code));
    if (selected.length !== codes.length) {
      return res.status(400).json({ message: 'One or more invalid seat codes' });
    }

    const unavailable = selected.some(
      (s) =>
        s.status === 'booked' ||
        (s.status === 'held' && String(s.heldBy) !== String(req.user._id))
    );

    if (unavailable) {
      return res.status(409).json({ message: 'One or more selected seats are no longer available.' });
    }

    const holdMinutes = Number(process.env.HOLD_MINUTES) || 5;
    const expiry = new Date(Date.now() + holdMinutes * 60000);

    for (const s of selected) {
      s.status = 'held';
      s.heldBy = req.user._id;
      s.holdExpiresAt = expiry;
    }

    await show.save();

    // Broadcast seat status update via Socket.IO
    io(req)?.to(`show:${show._id}`).emit('seats:changed', { showId: String(show._id) });

    res.json({
      message: 'Seats held successfully',
      expiresAt: expiry,
      seats: codes,
    });
  })
);

// POST /api/shows/:id/book - Confirm booking & payment
router.post(
  '/:id/book',
  protect,
  asyncHandler(async (req, res) => {
    const codes = [...new Set((req.body.seats || []).map(String))];

    if (!codes.length || codes.length > 8) {
      return res.status(400).json({ message: 'Select between 1 and 8 seats' });
    }

    const bookingCode =
      'IM' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

    // Execute booking logic safely (handles MongoDB Replica Sets and Standalone MongoDB instances)
    const executeBooking = async (session = null) => {
      const showQuery = Show.findById(req.params.id);
      if (session) showQuery.session(session);
      const show = await showQuery;

      if (!show || show.startsAt <= new Date()) {
        const err = new Error('Show not found or already started');
        err.status = 404;
        throw err;
      }

      cleanExpired(show);

      const seats = show.seats.filter((s) => codes.includes(s.code));
      const invalid =
        seats.length !== codes.length ||
        seats.some(
          (s) =>
            s.status !== 'held' ||
            String(s.heldBy) !== String(req.user._id) ||
            !s.holdExpiresAt ||
            s.holdExpiresAt <= new Date()
        );

      if (invalid) {
        const err = new Error('Your seat hold has expired or seats were released. Please select seats again.');
        err.status = 409;
        throw err;
      }

      const snacks = Array.isArray(req.body.snacks) ? req.body.snacks : [];
      const snacksTotal = snacks.reduce((sum, s) => sum + (s.price || 0) * (s.quantity || 1), 0);
      const subtotal = show.price * codes.length + snacksTotal;

      // Validate & calculate coupon discount
      const rawCoupon = String(req.body.couponCode || '').trim().toUpperCase();
      let discount = 0;
      let appliedCoupon = null;

      if (rawCoupon === 'IMOVIES50' && subtotal >= 200) {
        discount = 50;
        appliedCoupon = 'IMOVIES50';
      } else if (rawCoupon === 'POPCORN100' && subtotal >= 450) {
        discount = 100;
        appliedCoupon = 'POPCORN100';
      } else if (rawCoupon === 'BLOCKBUSTER20' && subtotal >= 300) {
        discount = Math.min(150, Math.round(subtotal * 0.2));
        appliedCoupon = 'BLOCKBUSTER20';
      } else if (rawCoupon === 'WELCOME75' && subtotal >= 250) {
        discount = 75;
        appliedCoupon = 'WELCOME75';
      }

      const totalAmount = Math.max(0, subtotal - discount);
      const paymentMethod = ['UPI', 'CARD', 'NETBANKING', 'WALLET'].includes(req.body.paymentMethod)
        ? req.body.paymentMethod
        : 'UPI';

      const booking = new Booking({
        user: req.user._id,
        show: show._id,
        movie: show.movie,
        theatre: show.theatre,
        seats: codes,
        snacks: snacks,
        amount: totalAmount,
        couponCode: appliedCoupon,
        discount: discount,
        paymentMethod: paymentMethod,
        status: 'confirmed',
        payment: 'mock-paid',
        bookingCode,
      });

      if (session) {
        await booking.save({ session });
      } else {
        await booking.save();
      }

      for (const s of seats) {
        s.status = 'booked';
        s.heldBy = null;
        s.holdExpiresAt = null;
        s.bookingId = booking._id;
      }

      if (session) {
        await show.save({ session });
      } else {
        await show.save();
      }

      return booking;
    };

    let newBooking;
    let session = null;

    try {
      session = await mongoose.startSession();
      // Try replica set transaction
      await session.withTransaction(async () => {
        newBooking = await executeBooking(session);
      });
    } catch (transactionErr) {
      // If MongoDB standalone doesn't support transactions, fall back to atomic non-session execution
      const isStandaloneErr =
        transactionErr.message?.includes('replica set') ||
        transactionErr.message?.includes('Transaction numbers are only allowed');

      if (isStandaloneErr) {
        newBooking = await executeBooking(null);
      } else {
        throw transactionErr;
      }
    } finally {
      if (session) {
        await session.endSession();
      }
    }

    const populated = await Booking.findById(newBooking._id)
      .populate('movie', 'title posterUrl durationMinutes')
      .populate('theatre', 'name location')
      .populate('show', 'startsAt screen');

    io(req)?.to(`show:${req.params.id}`).emit('seats:changed', { showId: req.params.id });

    res.status(201).json({
      booking: populated,
      note: 'Demo payment accepted. Seats confirmed!',
    });
  })
);

export default router;
