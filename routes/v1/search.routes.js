import { Router } from 'express';
import * as searchController from '../../controllers/search/search.controller.js';
import { optionalAuth } from '../../middlewares/auth.js';

const router = Router();

router.get('/', optionalAuth, searchController.search);
router.get('/suggest', searchController.suggest);
router.post('/nearby', searchController.nearby);
router.post('/estimate', searchController.estimate);

router.get('/listings/:listingId/preview', searchController.getPreview);

export default router;

