import mongoose from 'mongoose';

export const ALERT_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const ALERT_STATUS = {
  OPEN: 'open',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
};

export const ALERT_CATEGORY = {
  BOOKING: 'booking',
  PAYMENT: 'payment',
  INCIDENT: 'incident',
  SYSTEM: 'system',
  DOCUMENT: 'document',
};

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    message: {
      type: String,
      maxlength: 2000,
    },
    severity: {
      type: String,
      enum: Object.values(ALERT_SEVERITY),
      default: ALERT_SEVERITY.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ALERT_STATUS),
      default: ALERT_STATUS.OPEN,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(ALERT_CATEGORY),
      default: ALERT_CATEGORY.SYSTEM,
      index: true,
    },
    metadata: {
      booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
      payout: { type: mongoose.Schema.Types.ObjectId, ref: 'Payout' },
      incident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
      document: { type: mongoose.Schema.Types.ObjectId },
      payload: mongoose.Schema.Types.Mixed,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    dueAt: Date,
    tags: [String],
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ createdAt: -1 });
alertSchema.index({ category: 1, severity: -1, status: 1 });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;


