import { Router } from 'express';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import Theatre from '../models/Theatre.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendTicketEmail } from '../utils/mailer.js';

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

// POST /api/bookings/:id/send-email - Dispatch ticket confirmation email to user
router.post(
  '/:id/send-email',
  protect,
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
      .populate('movie')
      .populate('theatre')
      .populate('show')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Only allow owner or admin to trigger email
    if (String(booking.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to email this ticket.' });
    }

    const emailResult = await sendTicketEmail({
      booking,
      user: booking.user,
      movie: booking.movie,
      theatre: booking.theatre,
      show: booking.show,
    });

    res.json({
      success: true,
      message: `Admission ticket email sent to ${booking.user.email}!`,
      simulated: emailResult.simulated || false,
    });
  })
);

// POST /api/bookings/verify-ticket - Turnstile Usher QR Code entry scanner
router.post(
  '/verify-ticket',
  protect,
  asyncHandler(async (req, res) => {
    const rawCode = String(req.body.code || '').trim().toUpperCase();
    if (!rawCode) {
      return res.status(400).json({ message: 'Booking code or QR code is required.' });
    }

    const booking = await Booking.findOne({
      bookingCode: { $regex: new RegExp(`^${rawCode}$`, 'i') },
    })
      .populate('movie', 'title posterUrl durationMinutes certificate')
      .populate('theatre', 'name city location')
      .populate('show', 'startsAt screen price')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        valid: false,
        message: `Ticket "${rawCode}" does not exist in the cinema registry.`,
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        valid: false,
        status: 'cancelled',
        message: 'TICKET VOID: This booking was cancelled and refunded.',
        booking,
      });
    }

    if (booking.isUsed) {
      return res.status(400).json({
        valid: false,
        status: 'already_used',
        message: `ALREADY USED: Entry was previously scanned on ${new Date(
          booking.scannedAt
        ).toLocaleTimeString()} by ${booking.scannedBy || 'Turnstile Gate'}.`,
        booking,
      });
    }

    // Mark as used
    booking.isUsed = true;
    booking.scannedAt = new Date();
    booking.scannedBy = req.user.name || 'Cinema Usher';
    await booking.save();

    res.json({
      valid: true,
      status: 'approved',
      message: '✅ ADMISSION GRANTED: Valid boarding pass. Welcome to iMovies!',
      booking,
    });
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
