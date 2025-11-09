import mongoose from 'mongoose';
import { PAYMENT_STATUS } from '../utils/constants.js';

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    provider: {
      type: String,
      default: 'mock',
    },
    providerPaymentId: String,
    intentId: String,
    paymentMethod: {
      type: String,
      last4: String,
      brand: String,
    },
    capturedAt: Date,
    failedAt: Date,
    failureReason: String,
    refund: {
      amount: Number,
      refundedAt: Date,
      reason: String,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ providerPaymentId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;

