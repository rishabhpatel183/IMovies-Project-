import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
    },
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
    seats: {
      type: [String],
      required: true,
    },
    snacks: [
      {
        name: { type: String },
        price: { type: Number },
        quantity: { type: Number, default: 1 },
      },
    ],
    amount: {
      type: Number,
      required: true,
    },
    couponCode: {
      type: String,
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'CARD', 'NETBANKING', 'WALLET', 'DEMO', 'RAZORPAY'],
      default: 'UPI',
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    scannedAt: {
      type: Date,
      default: null,
    },
    scannedBy: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    payment: {
      type: String,
      enum: ['mock-paid', 'refunded', 'not-applicable'],
      default: 'mock-paid',
    },
    bookingCode: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Booking', bookingSchema);
