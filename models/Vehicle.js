import mongoose from 'mongoose';
import { VEHICLE_TYPES } from '../utils/constants.js';

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plate: {
      type: String,
      required: [true, 'La placa es requerida'],
      uppercase: true,
      trim: true,
    },
    make: {
      type: String,
      required: [true, 'La marca es requerida'],
    },
    model: {
      type: String,
      required: [true, 'El modelo es requerido'],
    },
    year: {
      type: Number,
      required: [true, 'El año es requerido'],
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    color: {
      type: String,
      required: [true, 'El color es requerido'],
    },
    type: {
      type: String,
      enum: Object.values(VEHICLE_TYPES),
      default: VEHICLE_TYPES.SEDAN,
    },
    dimensions: {
      length: Number, // cm
      width: Number, // cm
      height: Number, // cm
    },
    photos: [
      {
        url: String,
        publicId: String,
        order: Number,
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDate: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Compound index: user can't have duplicate plates
vehicleSchema.index({ owner: 1, plate: 1 }, { unique: true });
vehicleSchema.index({ plate: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;

