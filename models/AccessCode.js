import mongoose from 'mongoose';

const accessCodeSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },
    type: {
      type: String,
      enum: ['pin', 'qr', 'nfc'],
      default: 'pin',
    },
    code: {
      type: String,
      required: true,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    maxUsage: {
      type: Number,
      default: null, // null = unlimited
    },
    usageLog: [
      {
        usedAt: {
          type: Date,
          default: Date.now,
        },
        usedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        action: {
          type: String,
          enum: ['checkin', 'checkout', 'access'],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

accessCodeSchema.index({ listing: 1, validFrom: 1, validUntil: 1 });
accessCodeSchema.index({ code: 1, isActive: 1 });

accessCodeSchema.methods.canUse = function () {
  if (!this.isActive) return false;

  const now = new Date();
  if (now < this.validFrom || now > this.validUntil) return false;

  if (this.maxUsage && this.usageCount >= this.maxUsage) return false;

  return true;
};

const AccessCode = mongoose.model('AccessCode', accessCodeSchema);

export default AccessCode;

