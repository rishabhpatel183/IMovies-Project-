import { Router } from 'express';
import Movie from '../models/Movie.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/movies - List movies with pagination, search, genre filter
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const query = { active: true };

    if (req.query.genre && req.query.genre !== 'All') {
      const escaped = String(req.query.genre).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.genres = { $in: [new RegExp(`^${escaped}$`, 'i')] };
    }

    if (req.query.language) {
      const escaped = String(req.query.language).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.languages = { $in: [new RegExp(escaped, 'i')] };
    }

    if (req.query.search) {
      const escaped = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = { $regex: escaped, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      Movie.find(query)
        .sort({ releaseDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Movie.countDocuments(query),
    ]);

    res.json({
      items,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  })
);

// GET /api/movies/:id - Get movie details
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const movie = await Movie.findOne({ _id: req.params.id, active: true });
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  })
);

// POST /api/movies - Admin: Create new movie
router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const movie = await Movie.create(req.body);
    res.status(201).json(movie);
  })
);

// PUT /api/movies/:id - Admin: Update movie
router.put(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  })
);

// DELETE /api/movies/:id - Admin: Archive movie
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json({ message: 'Movie archived' });
  })
);

export default router;
