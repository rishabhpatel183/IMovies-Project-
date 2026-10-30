import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Show from '../models/Show.js';
import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';
import Theatre from '../models/Theatre.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendTicketEmail } from '../utils/mailer.js';

const router = Router();

// Initialize Razorpay client if credentials are provided
function getRazorpayClient() {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
}

// POST /api/payments/create-order - Initialize Razorpay checkout order
router.post(
  '/create-order',
  protect,
  asyncHandler(async (req, res) => {
    const { showId, seats: rawCodes, snacks = [], couponCode } = req.body;

    if (!showId || !Array.isArray(rawCodes) || rawCodes.length === 0) {
      return res.status(400).json({ message: 'showId and seats array are required.' });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: 'Showtime not found.' });
    }

    // Calculate subtotal
    const codes = rawCodes.map((c) => String(c).toUpperCase());
    const snacksTotal = snacks.reduce((sum, s) => sum + (s.price || 0) * (s.quantity || 1), 0);
    const subtotal = show.price * codes.length + snacksTotal;

    // Coupon discount logic
    const rawCoupon = String(couponCode || '').trim().toUpperCase();
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

    const client = getRazorpayClient();
    let order;

    if (client) {
      // Create real Razorpay order
      order = await client.orders.create({
        amount: Math.round(totalAmount * 100), // In paise
        currency: 'INR',
        receipt: `rcpt_${Date.now().toString().slice(-8)}`,
        notes: {
          showId,
          seats: codes.join(','),
          userId: String(req.user._id),
        },
      });
    } else {
      // Mock / Local Test Razorpay order
      order = {
        id: `order_mock_${Date.now()}`,
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        receipt: `rcpt_mock_${Date.now().toString().slice(-8)}`,
        status: 'created',
      };
    }

    res.json({
      order,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_imoviesDemo',
      amount: totalAmount,
      discount,
      couponCode: appliedCoupon,
      isRealGateway: Boolean(client),
    });
  })
);

// POST /api/payments/verify - Verify Razorpay HMAC signature and finalize booking
router.post(
  '/verify',
  protect,
  asyncHandler(async (req, res) => {
    const {
      showId,
      seats: rawCodes,
      snacks = [],
      couponCode,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: 'Showtime not found.' });
    }

    const codes = rawCodes.map((c) => String(c).toUpperCase());

    // Verify signature if real Razorpay secret is present
    if (process.env.RAZORPAY_KEY_SECRET && razorpay_order_id && !razorpay_order_id.startsWith('order_mock_')) {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid payment signature verification failed.' });
      }
    }

    // Calculate amounts
    const snacksTotal = snacks.reduce((sum, s) => sum + (s.price || 0) * (s.quantity || 1), 0);
    const subtotal = show.price * codes.length + snacksTotal;

    const rawCoupon = String(couponCode || '').trim().toUpperCase();
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
    const bookingCode = `IMV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

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
      paymentMethod: 'RAZORPAY',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id || `pay_${Date.now()}`,
      status: 'confirmed',
      payment: 'mock-paid',
      bookingCode,
    });

    await booking.save();

    // Mark show seats booked
    for (const seatCode of codes) {
      const s = show.seats.find((st) => st.code === seatCode);
      if (s) {
        s.status = 'booked';
        s.heldBy = null;
        s.holdExpiresAt = null;
        s.bookingId = booking._id;
      }
    }
    await show.save();

    // Notify connected clients via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`show:${show._id}`).emit('seats:changed', { showId: String(show._id) });
    }

    // Trigger asynchronous email confirmation
    Promise.all([
      Movie.findById(show.movie),
      Theatre.findById(show.theatre),
    ]).then(([m, t]) => {
      sendTicketEmail({
        booking,
        user: req.user,
        movie: m,
        theatre: t,
        show,
      }).catch((e) => console.error('[iMovies Payments] Email trigger failed:', e));
    });

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed successfully.',
      booking,
    });
  })
);

export default router;
