import { Router } from 'express';
import * as listingsController from '../../controllers/listings/listings.controller.js';
import { requireAuth, optionalAuth } from '../../middlewares/auth.js';
import { requireHost } from '../../middlewares/roles.js';

const router = Router();

router.get('/', optionalAuth, listingsController.getListings);
router.post('/', requireAuth, requireHost, listingsController.createListing);

router.get('/:listingId', optionalAuth, listingsController.getListingById);
router.patch('/:listingId', requireAuth, requireHost, listingsController.updateListing);
router.delete('/:listingId', requireAuth, requireHost, listingsController.deleteListing);

router.post('/:listingId/publish', requireAuth, requireHost, listingsController.publishListing);
router.post('/:listingId/unpublish', requireAuth, requireHost, listingsController.unpublishListing);

router.post('/:listingId/photos', requireAuth, requireHost, listingsController.addPhoto);
router.delete('/:listingId/photos/:photoId', requireAuth, requireHost, listingsController.deletePhoto);

router.get('/:listingId/amenities', optionalAuth, listingsController.getAmenities);
router.patch('/:listingId/amenities', requireAuth, requireHost, listingsController.updateAmenities);

export default router;

