import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      index: true,
    },
    reviewType: {
      type: String,
      enum: ['host', 'driver'],
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 1000,
    },
    categories: {
      cleanliness: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      accuracy: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    response: {
      text: String,
      respondedAt: Date,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: String,
  },
  {
    timestamps: true,
  }
);

// One review per booking per type
reviewSchema.index({ booking: 1, reviewType: 1 }, { unique: true });
reviewSchema.index({ listing: 1, isPublic: 1 });
reviewSchema.index({ reviewee: 1, reviewType: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

