import mongoose from 'mongoose';
import { TRANSACTION_TYPES } from '../utils/constants.js';

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: String,
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'transactions.referenceModel',
    },
    referenceModel: {
      type: String,
      enum: ['Booking', 'Payment', 'Payout'],
    },
    balanceAfter: Number,
  },
  { _id: true, timestamps: true }
);

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    transactions: [transactionSchema],
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet;

