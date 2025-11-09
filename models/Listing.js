import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { LISTING_STATUS, LISTING_TYPES, AMENITIES } from '../utils/constants.js';

const listingSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'La descripción es requerida'],
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: Object.values(LISTING_TYPES),
      required: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: String,
      country: { type: String, default: 'US' },
      fullAddress: String,
      // La ubicación exacta se oculta hasta confirmación
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
      },
      // Ubicación aproximada para búsqueda pública
      approximateLocation: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
        },
      },
    },
    dimensions: {
      length: Number, // cm
      width: Number, // cm
      height: Number, // cm
      maxVehicleSize: String, // "sedan", "suv", "truck"
    },
    amenities: [
      {
        type: String,
        enum: AMENITIES,
      },
    ],
    photos: [
      {
        url: { type: String, required: true },
        publicId: String,
        caption: String,
        order: { type: Number, default: 0 },
      },
    ],
    videos: [
      {
        url: String,
        publicId: String,
        caption: String,
      },
    ],
    pricing: {
      hourlyRate: {
        type: Number,
        required: true,
        min: 0,
      },
      dailyRate: {
        type: Number,
        min: 0,
      },
      weeklyRate: Number,
      monthlyRate: Number,
      specials: [
        {
          name: String,
          type: { type: String, enum: ['percentage', 'fixed', 'override'] },
          value: Number,
          startDate: Date,
          endDate: Date,
          daysOfWeek: [Number], // 0-6
          startTime: String, // "HH:mm"
          endTime: String, // "HH:mm"
        },
      ],
    },
    rules: {
      minBookingHours: { type: Number, default: 1 },
      maxBookingDays: { type: Number, default: 30 },
      instantBook: { type: Boolean, default: false },
      requiresApproval: { type: Boolean, default: false },
      cancellationPolicy: {
        type: String,
        enum: ['flexible', 'moderate', 'strict'],
        default: 'flexible',
      },
      checkInInstructions: String,
      parkingInstructions: String,
    },
    availability: {
      isAvailable: { type: Boolean, default: true },
      schedule: {
        monday: { available: Boolean, startTime: String, endTime: String },
        tuesday: { available: Boolean, startTime: String, endTime: String },
        wednesday: { available: Boolean, startTime: String, endTime: String },
        thursday: { available: Boolean, startTime: String, endTime: String },
        friday: { available: Boolean, startTime: String, endTime: String },
        saturday: { available: Boolean, startTime: String, endTime: String },
        sunday: { available: Boolean, startTime: String, endTime: String },
      },
      blocks: [
        {
          startDate: Date,
          endDate: Date,
          reason: String,
        },
      ],
    },
    status: {
      type: String,
      enum: Object.values(LISTING_STATUS),
      default: LISTING_STATUS.DRAFT,
    },
    stats: {
      views: { type: Number, default: 0 },
      bookings: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },
    publishedAt: Date,
    suspendedAt: Date,
    suspendedReason: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Geospatial index for location queries
listingSchema.index({ 'address.location': '2dsphere' });
listingSchema.index({ 'address.approximateLocation': '2dsphere' });
listingSchema.index({ host: 1, status: 1 });
listingSchema.index({ status: 1, 'address.city': 1 });
listingSchema.index({ 'pricing.hourlyRate': 1 });

// Plugin
listingSchema.plugin(mongoosePaginate);

// Virtual for reviews
listingSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'listing',
});

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;

