import { Router } from 'express';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/bookings/my - Get user's booking history
router.get(
  '/my',
  protect,
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('movie', 'title posterUrl durationMinutes certificate')
      .populate('theatre', 'name location screens')
      .populate('show', 'startsAt screen price')
      .sort({ createdAt: -1 });

    res.json(bookings);
  })
);

// POST /api/bookings/:id/cancel - Cancel a booking
router.post(
  '/:id/cancel',
  protect,
  asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    const show = await Show.findById(booking.show);
    if (!show || show.startsAt <= new Date()) {
      return res.status(400).json({ message: 'Shows that have already started cannot be cancelled.' });
    }

    // Release booked seats back to available
    for (const seat of show.seats) {
      if (String(seat.bookingId) === String(booking._id)) {
        seat.status = 'available';
        seat.bookingId = null;
        seat.heldBy = null;
        seat.holdExpiresAt = null;
      }
    }

    booking.status = 'cancelled';
    booking.payment = 'refunded';

    await Promise.all([show.save(), booking.save()]);

    // Emit live seat update
    req.app.get('io')?.to(`show:${show._id}`).emit('seats:changed', { showId: String(show._id) });

    res.json({
      message: 'Booking cancelled successfully (demo refund processed)',
      booking,
    });
  })
);

export default router;
