import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    description: String,
    minAmount: {
      type: Number,
      default: 0,
    },
    maxDiscount: Number,
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: Date,
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    userLimit: {
      type: Number,
      default: 1, // Max uses per user
    },
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        booking: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Booking',
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableToListings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
      },
    ],
    applicableToUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ code: 1, isActive: 1 });

couponSchema.methods.canUse = function (userId, amount) {
  // Check if active
  if (!this.isActive) return { valid: false, reason: 'Cupón inactivo' };

  // Check dates
  const now = new Date();
  if (this.validFrom && now < this.validFrom)
    return { valid: false, reason: 'Cupón aún no válido' };
  if (this.validUntil && now > this.validUntil)
    return { valid: false, reason: 'Cupón expirado' };

  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit)
    return { valid: false, reason: 'Cupón agotado' };

  // Check user limit
  const userUsage = this.usedBy.filter((u) => u.user.toString() === userId.toString()).length;
  if (userUsage >= this.userLimit)
    return { valid: false, reason: 'Ya usaste este cupón' };

  // Check min amount
  if (amount < this.minAmount)
    return { valid: false, reason: `Monto mínimo: ${this.minAmount}` };

  return { valid: true };
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;

