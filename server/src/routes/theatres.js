import { Router } from 'express';
import Theatre from '../models/Theatre.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/theatres - List active theatres
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const theatres = await Theatre.find({ active: true }).sort({ name: 1 });
    res.json(theatres);
  })
);

// POST /api/theatres - Admin: Add theatre
router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const theatre = await Theatre.create(req.body);
    res.status(201).json(theatre);
  })
);

// PUT /api/theatres/:id - Admin: Update theatre
router.put(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!theatre) {
      return res.status(404).json({ message: 'Theatre not found' });
    }
    res.json(theatre);
  })
);

export default router;
