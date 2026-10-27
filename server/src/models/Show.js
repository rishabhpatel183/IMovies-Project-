import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'held', 'booked'],
      default: 'available',
    },
    heldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    holdExpiresAt: {
      type: Date,
      default: null,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
    },
    screen: {
      type: String,
      default: 'Screen 1',
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    seatLayout: {
      rows: { type: Number, default: 6 },
      cols: { type: Number, default: 8 },
    },
    seats: [seatSchema],
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

showSchema.index({ movie: 1, startsAt: 1, active: 1 });
showSchema.index({ theatre: 1, startsAt: 1 });

export default mongoose.model('Show', showSchema);
