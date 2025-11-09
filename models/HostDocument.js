import mongoose from 'mongoose';

export const DOCUMENT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
};

export const DOCUMENT_CATEGORY = {
  CONTRACT: 'contract',
  INVOICE: 'invoice',
  LEGAL: 'legal',
  SUPPORT: 'support',
  OTHER: 'other',
};

const hostDocumentSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    category: {
      type: String,
      enum: Object.values(DOCUMENT_CATEGORY),
      default: DOCUMENT_CATEGORY.OTHER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(DOCUMENT_STATUS),
      default: DOCUMENT_STATUS.ACTIVE,
      index: true,
    },
    tags: [String],
    fileName: String,
    filePath: String,
    mimeType: String,
    size: Number,
    url: String,
    notes: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const HostDocument = mongoose.model('HostDocument', hostDocumentSchema);

export default HostDocument;


