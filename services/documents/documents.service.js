import path from 'path';
import fs from 'fs/promises';
import HostDocument, {
  DOCUMENT_CATEGORY,
  DOCUMENT_STATUS,
} from '../../models/HostDocument.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'public/uploads/documents');

const sanitizeDocument = (doc) => ({
  id: doc._id.toString(),
  title: doc.title,
  category: doc.category,
  status: doc.status,
  tags: doc.tags || [],
  url: doc.url,
  fileName: doc.fileName,
  mimeType: doc.mimeType,
  size: doc.size,
  notes: doc.notes,
  uploadedAt: doc.uploadedAt,
  uploadedBy: doc.uploadedBy,
});

const ensureDirectory = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const normalizeFileName = (fileName) =>
  fileName
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_{2,}/g, '_');

export const listDocuments = async (hostId, { category, status } = {}) => {
  const filter = { host: hostId };
  if (category) filter.category = category;
  if (status) filter.status = status;

  const documents = await HostDocument.find(filter).sort({ uploadedAt: -1 }).lean();

  const summary = documents.reduce(
    (acc, doc) => {
      acc.total += 1;
      if (doc.status === DOCUMENT_STATUS.ACTIVE) acc.active += 1;
      acc.byCategory[doc.category] = (acc.byCategory[doc.category] || 0) + 1;
      return acc;
    },
    { total: 0, active: 0, byCategory: {} }
  );

  return {
    documents: documents.map(sanitizeDocument),
    summary,
    metadata: {
      categories: DOCUMENT_CATEGORY,
      status: DOCUMENT_STATUS,
    },
  };
};

export const createDocument = async ({ hostId, userId, file, payload }) => {
  if (!file) {
    throw new BadRequestError('Debes adjuntar un archivo');
  }

  const title = payload.title?.trim();
  if (!title) {
    throw new BadRequestError('El título es obligatorio');
  }

  const category = Object.values(DOCUMENT_CATEGORY).includes(payload.category)
    ? payload.category
    : DOCUMENT_CATEGORY.OTHER;

  const tags = Array.isArray(payload.tags)
    ? payload.tags
    : (payload.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

  const hostDir = path.join(UPLOAD_ROOT, hostId.toString());
  await ensureDirectory(hostDir);

  const safeName = normalizeFileName(file.name || 'documento');
  const fileName = `${Date.now()}-${safeName}`;
  const targetPath = path.join(hostDir, fileName);

  await file.mv(targetPath);

  const relativeUrl = `/uploads/documents/${hostId}/${fileName}`;

  const document = await HostDocument.create({
    host: hostId,
    title,
    category,
    tags,
    notes: payload.notes,
    fileName: file.name,
    filePath: targetPath,
    mimeType: file.mimetype,
    size: file.size,
    url: relativeUrl,
    uploadedBy: userId,
    uploadedAt: new Date(),
  });

  return sanitizeDocument(document);
};

export const updateDocument = async ({ hostId, documentId, payload }) => {
  const document = await HostDocument.findOne({ _id: documentId, host: hostId });
  if (!document) {
    throw new NotFoundError('Documento no encontrado');
  }

  if (payload.title) {
    document.title = payload.title.trim();
  }
  if (payload.category && Object.values(DOCUMENT_CATEGORY).includes(payload.category)) {
    document.category = payload.category;
  }
  if (payload.notes !== undefined) {
    document.notes = payload.notes;
  }
  if (payload.tags) {
    document.tags = Array.isArray(payload.tags)
      ? payload.tags
      : payload.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
  }
  if (payload.status && Object.values(DOCUMENT_STATUS).includes(payload.status)) {
    document.status = payload.status;
  }

  await document.save();

  return sanitizeDocument(document);
};

export const removeDocument = async ({ hostId, documentId }) => {
  const document = await HostDocument.findOne({ _id: documentId, host: hostId });
  if (!document) {
    throw new NotFoundError('Documento no encontrado');
  }

  if (document.filePath) {
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      // ignore missing file
    }
  }

  await HostDocument.deleteOne({ _id: documentId });

  return { id: documentId, removed: true };
};


