import { Router } from 'express';
import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';
import Theatre from '../models/Theatre.js';
import Show from '../models/Show.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/admin/analytics - Overview metrics, revenue, top movies & recent transactions
router.get(
  '/analytics',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const [confirmedBookings, totalMovies, totalTheatres, totalShows] = await Promise.all([
      Booking.find({ status: 'confirmed' })
        .populate('movie', 'title posterUrl genres rating durationMinutes')
        .populate('theatre', 'name city location')
        .populate('user', 'name email')
        .sort({ createdAt: -1 }),
      Movie.countDocuments({ active: true }),
      Theatre.countDocuments(),
      Show.countDocuments(),
    ]);

    let totalRevenue = 0;
    let totalTicketsSold = 0;
    let totalSnacksRevenue = 0;
    let totalDiscountGiven = 0;

    const movieSalesMap = {};
    const citySalesMap = {};

    confirmedBookings.forEach((b) => {
      totalRevenue += b.amount || 0;
      totalTicketsSold += Array.isArray(b.seats) ? b.seats.length : 1;
      totalDiscountGiven += b.discount || 0;

      // Calculate snacks sum
      if (Array.isArray(b.snacks)) {
        b.snacks.forEach((s) => {
          totalSnacksRevenue += (s.price || 0) * (s.quantity || 1);
        });
      }

      // Group by movie
      const movieId = b.movie?._id ? String(b.movie._id) : 'unknown';
      const movieTitle = b.movie?.title || 'Unknown Film';
      const moviePoster = b.movie?.posterUrl || '';
      if (!movieSalesMap[movieId]) {
        movieSalesMap[movieId] = {
          id: movieId,
          title: movieTitle,
          posterUrl: moviePoster,
          rating: b.movie?.rating || 8.0,
          revenue: 0,
          tickets: 0,
          bookingsCount: 0,
        };
      }
      movieSalesMap[movieId].revenue += b.amount || 0;
      movieSalesMap[movieId].tickets += Array.isArray(b.seats) ? b.seats.length : 1;
      movieSalesMap[movieId].bookingsCount += 1;

      // Group by city
      const city = b.theatre?.city || 'Mumbai';
      if (!citySalesMap[city]) {
        citySalesMap[city] = { city, revenue: 0, tickets: 0 };
      }
      citySalesMap[city].revenue += b.amount || 0;
      citySalesMap[city].tickets += Array.isArray(b.seats) ? b.seats.length : 1;
    });

    const topMovies = Object.values(movieSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const cityDistribution = Object.values(citySalesMap).sort((a, b) => b.revenue - a.revenue);

    const recentBookings = confirmedBookings.slice(0, 10).map((b) => ({
      _id: b._id,
      bookingCode: b.bookingCode,
      userName: b.user?.name || 'Customer',
      userEmail: b.user?.email || 'N/A',
      movieTitle: b.movie?.title || 'Feature Film',
      theatreName: b.theatre?.name || 'Multiplex',
      city: b.theatre?.city || 'India',
      seats: b.seats,
      amount: b.amount,
      discount: b.discount || 0,
      paymentMethod: b.paymentMethod || 'UPI',
      createdAt: b.createdAt,
    }));

    res.json({
      summary: {
        totalRevenue,
        totalBookings: confirmedBookings.length,
        totalTicketsSold,
        totalSnacksRevenue,
        totalDiscountGiven,
        totalMovies,
        totalTheatres,
        totalShows,
      },
      topMovies,
      cityDistribution,
      recentBookings,
    });
  })
);

export default router;
