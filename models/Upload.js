import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: String,
    mimeType: String,
    size: Number, // bytes
    url: {
      type: String,
      required: true,
    },
    publicId: String,
    folder: String,
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'other'],
      default: 'image',
    },
    reference: {
      model: String,
      id: mongoose.Schema.Types.ObjectId,
    },
    metadata: mongoose.Schema.Types.Mixed,
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

uploadSchema.index({ user: 1, type: 1 });
uploadSchema.index({ publicId: 1 });

const Upload = mongoose.model('Upload', uploadSchema);

export default Upload;

