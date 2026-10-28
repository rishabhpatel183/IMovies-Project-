import mongoose from 'mongoose';

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      default: 'Mumbai',
      trim: true,
      index: true,
    },
    address: {
      type: String,
      default: '',
    },
    screens: {
      type: [String],
      default: ['Screen 1', 'Screen 2', 'IMAX Screen'],
    },
    facilities: {
      type: [String],
      default: ['Parking', 'Dolby Atmos', 'Recliner Seats', 'Food Court'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Theatre', theatreSchema);
