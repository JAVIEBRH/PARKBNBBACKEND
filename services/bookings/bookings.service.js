import Booking from '../../models/Booking.js';
import Listing from '../../models/Listing.js';
import Vehicle from '../../models/Vehicle.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import { BOOKING_STATUS } from '../../utils/constants.js';
import { canTransition, canCheckIn, canCheckOut } from '../../utils/bookingState.js';
import { estimatePrice } from '../../utils/pricing.js';
import { isOverlapping } from '../../utils/dateTime.js';
import { getPaginationParams } from '../../utils/pagination.js';

export const getBookings = async (userId, query) => {
  const { page, limit, skip, sort } = getPaginationParams(query);

  const filter = {};

  // Filter by role
  if (query.role === 'host') {
    const listings = await Listing.find({ host: userId }).select('_id');
    filter.listing = { $in: listings.map((l) => l._id) };
  } else {
    filter.driver = userId;
  }

  // Filter by status
  if (query.status) {
    filter.status = query.status;
  }

  const bookings = await Booking.find(filter)
    .populate('listing', 'title address pricing')
    .populate('driver', 'firstName lastName avatar')
    .populate('vehicle', 'plate make model')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Booking.countDocuments(filter);

  return {
    bookings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createBooking = async (userId, data) => {
  const listing = await Listing.findById(data.listingId);

  if (!listing || listing.status !== 'published') {
    throw new NotFoundError('Listing no encontrado o no disponible');
  }

  const vehicle = await Vehicle.findById(data.vehicleId);

  if (!vehicle || vehicle.owner.toString() !== userId) {
    throw new ValidationError('Vehículo inválido');
  }

  // Check for overlapping bookings
  const overlapping = await Booking.findOne({
    listing: data.listingId,
    status: { $in: ['confirmed', 'active'] },
    $or: [
      { startDate: { $lte: data.endDate }, endDate: { $gte: data.startDate } },
    ],
  });

  if (overlapping) {
    throw new ValidationError('El horario seleccionado no está disponible');
  }

  // Calculate pricing
  const pricing = estimatePrice(listing, new Date(data.startDate), new Date(data.endDate), null);

  const status = listing.rules.instantBook
    ? BOOKING_STATUS.CONFIRMED
    : listing.rules.requiresApproval
    ? BOOKING_STATUS.PENDING_APPROVAL
    : BOOKING_STATUS.CONFIRMED;

  const booking = await Booking.create({
    listing: data.listingId,
    driver: userId,
    vehicle: data.vehicleId,
    startDate: data.startDate,
    endDate: data.endDate,
    status,
    pricing: {
      basePrice: pricing.basePrice,
      serviceFee: pricing.serviceFee,
      discount: pricing.discount,
      total: pricing.total,
      hostPayout: pricing.hostPayout,
    },
    specialInstructions: data.specialInstructions,
  });

  return booking.populate(['listing', 'driver', 'vehicle']);
};

export const getBookingById = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId)
    .populate('listing')
    .populate('driver', 'firstName lastName avatar email phone')
    .populate('vehicle');

  if (!booking) {
    throw new NotFoundError('Reserva no encontrada');
  }

  // Check access
  const isDriver = booking.driver._id.toString() === userId;
  const isHost = booking.listing.host.toString() === userId;

  if (!isDriver && !isHost) {
    throw new ForbiddenError('No tienes permiso para ver esta reserva');
  }

  return booking;
};

export const confirmBooking = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId).populate('listing');

  if (!booking) {
    throw new NotFoundError('Reserva no encontrada');
  }

  if (booking.listing.host.toString() !== userId) {
    throw new ForbiddenError('Solo el host puede confirmar la reserva');
  }

  if (!canTransition(booking.status, BOOKING_STATUS.CONFIRMED)) {
    throw new ValidationError('No se puede confirmar la reserva en su estado actual');
  }

  booking.status = BOOKING_STATUS.CONFIRMED;
  await booking.save();

  return booking;
};

export const declineBooking = async (bookingId, userId, reason) => {
  const booking = await Booking.findById(bookingId).populate('listing');

  if (!booking) {
    throw new NotFoundError('Reserva no encontrada');
  }

  if (booking.listing.host.toString() !== userId) {
    throw new ForbiddenError('Solo el host puede rechazar la reserva');
  }

  if (!canTransition(booking.status, BOOKING_STATUS.DECLINED)) {
    throw new ValidationError('No se puede rechazar la reserva en su estado actual');
  }

  booking.status = BOOKING_STATUS.DECLINED;
  booking.timeline.push({
    status: BOOKING_STATUS.DECLINED,
    by: userId,
    note: reason,
  });

  await booking.save();

  return booking;
};

export const cancelBooking = async (bookingId, userId, reason) => {
  const booking = await Booking.findById(bookingId).populate('listing');

  if (!booking) {
    throw new NotFoundError('Reserva no encontrada');
  }

  if (booking.driver.toString() !== userId) {
    throw new ForbiddenError('Solo el conductor puede cancelar la reserva');
  }

  if (!canTransition(booking.status, BOOKING_STATUS.CANCELLED)) {
    throw new ValidationError('No se puede cancelar la reserva en su estado actual');
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  booking.cancellation = {
    cancelledBy: userId,
    cancelledAt: new Date(),
    reason,
  };

  await booking.save();

  return booking;
};

export const checkIn = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new NotFoundError('Reserva no encontrada');
  }

  if (booking.driver.toString() !== userId) {
    throw new ForbiddenError('Solo el conductor puede hacer check-in');
  }

  if (!canCheckIn(booking)) {
    throw new ValidationError('No se puede hacer check-in en este momento');
  }

  booking.status = BOOKING_STATUS.ACTIVE;
  booking.checkIn = {
    at: new Date(),
    verified: true,
  };

  await booking.save();

  return booking;
};

export const checkOut = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new NotFoundError('Reserva no encontrada');
  }

  if (booking.driver.toString() !== userId) {
    throw new ForbiddenError('Solo el conductor puede hacer check-out');
  }

  if (!canCheckOut(booking)) {
    throw new ValidationError('No se puede hacer check-out en este momento');
  }

  booking.status = BOOKING_STATUS.COMPLETED;
  booking.checkOut = {
    at: new Date(),
    verified: true,
  };

  await booking.save();

  return booking;
};

export const getTimeline = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId).populate('timeline.by', 'firstName lastName');

  if (!booking) {
    throw new NotFoundError('Reserva no encontrada');
  }

  const isDriver = booking.driver.toString() === userId;
  const listing = await Listing.findById(booking.listing);
  const isHost = listing.host.toString() === userId;

  if (!isDriver && !isHost) {
    throw new ForbiddenError('No tienes permiso para ver el timeline de esta reserva');
  }

  return booking.timeline;
};

