import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { BOOKING_STATUS } from '../utils/constants.js';

const bookingSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.DRAFT,
      index: true,
    },
    pricing: {
      basePrice: { type: Number, required: true },
      serviceFee: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      overstayCharge: { type: Number, default: 0 },
      total: { type: Number, required: true },
      hostPayout: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    payout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payout',
    },
    checkIn: {
      at: Date,
      code: String,
      verified: Boolean,
    },
    checkOut: {
      at: Date,
      code: String,
      verified: Boolean,
    },
    timeline: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        note: String,
      },
    ],
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      cancelledAt: Date,
      reason: String,
      refundAmount: Number,
    },
    dispute: {
      openedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      openedAt: Date,
      reason: String,
      status: String,
      resolution: String,
    },
    extension: {
      requestedAt: Date,
      newEndDate: Date,
      additionalCharge: Number,
      status: String, // pending, approved, declined
    },
    accessCode: String,
    specialInstructions: String,
    driverNotes: String,
    hostNotes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
bookingSchema.index({ listing: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ driver: 1, status: 1 });
bookingSchema.index({ status: 1, startDate: 1 });

// Plugin
bookingSchema.plugin(mongoosePaginate);

// Add to timeline before save
bookingSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      at: new Date(),
    });
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;

