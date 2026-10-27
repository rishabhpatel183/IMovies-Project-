import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    posterUrl: {
      type: String,
      default: '',
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    genres: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: ['Hindi', 'English'],
    },
    durationMinutes: {
      type: Number,
      default: 120,
      min: 1,
    },
    releaseDate: {
      type: Date,
      default: Date.now,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 8.5,
    },
    certificate: {
      type: String,
      default: 'U/A',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

movieSchema.index({ genres: 1, active: 1 });

export default mongoose.model('Movie', movieSchema);
