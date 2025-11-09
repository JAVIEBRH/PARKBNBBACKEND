import mongoose from 'mongoose';

const calendarSyncSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    google: {
      connected: { type: Boolean, default: false },
      accountEmail: String,
      lastSyncedAt: Date,
      syncEnabled: { type: Boolean, default: false },
    },
    lastGeneratedAt: Date,
    lastAccessAt: Date,
  },
  {
    timestamps: true,
  }
);

const CalendarSync = mongoose.model('CalendarSync', calendarSyncSchema);

export default CalendarSync;


