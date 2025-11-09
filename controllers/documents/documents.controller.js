import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import {
  listDocuments,
  createDocument,
  updateDocument,
  removeDocument,
} from '../../services/documents/documents.service.js';

const parsePayload = (body = {}) => {
  const payload = { ...body };
  if (typeof payload.tags === 'string') {
    try {
      const parsed = JSON.parse(payload.tags);
      if (Array.isArray(parsed)) {
        payload.tags = parsed;
      }
    } catch (error) {
      // leave as string (comma separated)
    }
  }
  return payload;
};

export const listDocumentsController = asyncHandler(async (req, res) => {
  const result = await listDocuments(req.user._id, req.query);
  successResponse(res, result, 'Documentos obtenidos');
});

export const createDocumentController = asyncHandler(async (req, res) => {
  const file = req.files?.file;
  const payload = parsePayload(req.body);
  const document = await createDocument({
    hostId: req.user._id,
    userId: req.user._id,
    file,
    payload,
  });
  successResponse(res, document, 'Documento guardado');
});

export const updateDocumentController = asyncHandler(async (req, res) => {
  const payload = parsePayload(req.body);
  const document = await updateDocument({
    hostId: req.user._id,
    documentId: req.params.documentId,
    payload,
  });
  successResponse(res, document, 'Documento actualizado');
});

export const deleteDocumentController = asyncHandler(async (req, res) => {
  const result = await removeDocument({
    hostId: req.user._id,
    documentId: req.params.documentId,
  });
  successResponse(res, result, 'Documento eliminado');
});

export default {
  listDocumentsController,
  createDocumentController,
  updateDocumentController,
  deleteDocumentController,
};


