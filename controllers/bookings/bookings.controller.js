import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../../utils/response.js';
import * as bookingsService from '../../services/bookings/bookings.service.js';

export const getBookings = asyncHandler(async (req, res) => {
  const result = await bookingsService.getBookings(req.user._id, req.query);

  paginatedResponse(
    res,
    result.bookings,
    result.meta.page,
    result.meta.limit,
    result.meta.total,
    'Reservas obtenidas'
  );
});

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.createBooking(req.user._id, req.body);

  successResponse(res, { booking }, 'Reserva creada');
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingsService.getBookingById(req.params.bookingId, req.user._id);

  successResponse(res, { booking }, 'Reserva obtenida');
});

export const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.confirmBooking(req.params.bookingId, req.user._id);

  successResponse(res, { booking }, 'Reserva confirmada');
});

export const declineBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.declineBooking(
    req.params.bookingId,
    req.user._id,
    req.body.reason
  );

  successResponse(res, { booking }, 'Reserva rechazada');
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.cancelBooking(
    req.params.bookingId,
    req.user._id,
    req.body.reason
  );

  successResponse(res, { booking }, 'Reserva cancelada');
});

export const checkIn = asyncHandler(async (req, res) => {
  const booking = await bookingsService.checkIn(req.params.bookingId, req.user._id);

  successResponse(res, { booking }, 'Check-in realizado');
});

export const checkOut = asyncHandler(async (req, res) => {
  const booking = await bookingsService.checkOut(req.params.bookingId, req.user._id);

  successResponse(res, { booking }, 'Check-out realizado');
});

export const getTimeline = asyncHandler(async (req, res) => {
  const timeline = await bookingsService.getTimeline(req.params.bookingId, req.user._id);

  successResponse(res, { timeline }, 'Timeline obtenido');
});

