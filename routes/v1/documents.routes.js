import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireHost } from '../../middlewares/roles.js';
import {
  listDocumentsController,
  createDocumentController,
  updateDocumentController,
  deleteDocumentController,
} from '../../controllers/documents/documents.controller.js';

const router = Router();

router.use(requireAuth, requireHost);

router.get('/', listDocumentsController);
router.post('/', createDocumentController);
router.patch('/:documentId', updateDocumentController);
router.delete('/:documentId', deleteDocumentController);

export default router;


