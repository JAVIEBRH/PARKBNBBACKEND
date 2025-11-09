import mongoose from 'mongoose';

export const AUTOMATION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
};

export const AUTOMATION_TRIGGERS = {
  BOOKING_CREATED: 'booking_created',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BEFORE_CHECKIN: 'before_checkin',
  AFTER_CHECKOUT: 'after_checkout',
  BOOKING_CANCELLED: 'booking_cancelled',
};

export const AUTOMATION_CHANNELS = ['in_app', 'email', 'push'];

const automationSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: Object.values(AUTOMATION_STATUS),
      default: AUTOMATION_STATUS.ACTIVE,
      index: true,
    },
    trigger: {
      type: String,
      enum: Object.values(AUTOMATION_TRIGGERS),
      required: true,
    },
    schedule: {
      offset: { type: Number, default: 0 },
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
        default: 'hours',
      },
      direction: {
        type: String,
        enum: ['before', 'after'],
        default: 'before',
      },
      reference: {
        type: String,
        enum: ['checkin', 'checkout', 'booking_creation'],
        default: 'checkin',
      },
    },
    channels: [
      {
        type: String,
        enum: AUTOMATION_CHANNELS,
      },
    ],
    template: {
      subject: { type: String, maxlength: 120 },
      body: { type: String, required: true },
      variables: [{ type: String }],
      preview: { type: String },
    },
    audience: {
      type: String,
      enum: ['all', 'newGuests', 'returning', 'highValue'],
      default: 'all',
    },
    conditions: {
      minStayNights: Number,
      minGuestRating: Number,
      listings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastTriggeredAt: Date,
  },
  {
    timestamps: true,
  }
);

automationSchema.index({ host: 1, trigger: 1, status: 1 });

const MessageAutomation = mongoose.model('MessageAutomation', automationSchema);

export default MessageAutomation;


