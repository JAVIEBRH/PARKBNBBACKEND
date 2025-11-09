import { Router } from 'express';
import * as bookingsController from '../../controllers/bookings/bookings.controller.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', bookingsController.getBookings);
router.post('/', bookingsController.createBooking);
router.get('/:bookingId', bookingsController.getBookingById);

router.post('/:bookingId/confirm', bookingsController.confirmBooking);
router.post('/:bookingId/decline', bookingsController.declineBooking);
router.post('/:bookingId/cancel', bookingsController.cancelBooking);

router.post('/:bookingId/checkin', bookingsController.checkIn);
router.post('/:bookingId/checkout', bookingsController.checkOut);

router.get('/:bookingId/timeline', bookingsController.getTimeline);

export default router;

