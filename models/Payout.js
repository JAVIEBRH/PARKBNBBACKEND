import mongoose from 'mongoose';
import { PAYOUT_STATUS } from '../utils/constants.js';

const payoutSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
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
      enum: Object.values(PAYOUT_STATUS),
      default: PAYOUT_STATUS.PENDING,
      index: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    failureReason: String,
    payoutAccount: {
      accountNumber: String,
      bankName: String,
      accountHolderName: String,
    },
    provider: {
      type: String,
      default: 'mock',
    },
    providerPayoutId: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

payoutSchema.index({ host: 1, status: 1 });
payoutSchema.index({ status: 1, scheduledFor: 1 });

const Payout = mongoose.model('Payout', payoutSchema);

export default Payout;

