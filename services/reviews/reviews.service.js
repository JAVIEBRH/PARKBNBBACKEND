import Review from '../../models/Review.js';
import Booking from '../../models/Booking.js';
import Listing from '../../models/Listing.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import { BOOKING_STATUS } from '../../utils/constants.js';
import { getPaginationParams } from '../../utils/pagination.js';

export const createHostReview = async (userId, hostId, data) => {
  // Find a completed booking where user was driver and host was the listing owner
  const booking = await Booking.findOne({
    _id: data.bookingId,
    driver: userId,
    status: BOOKING_STATUS.COMPLETED,
  }).populate('listing');

  if (!booking) {
    throw new NotFoundError('Reserva no encontrada o no completada');
  }

  if (booking.listing.host.toString() !== hostId) {
    throw new ValidationError('El host no coincide con la reserva');
  }

  // Check if review already exists
  const existingReview = await Review.findOne({
    booking: data.bookingId,
    reviewType: 'host',
  });

  if (existingReview) {
    throw new ValidationError('Ya has reseñado este host para esta reserva');
  }

  const review = await Review.create({
    booking: data.bookingId,
    listing: booking.listing._id,
    reviewType: 'host',
    reviewer: userId,
    reviewee: hostId,
    rating: data.rating,
    comment: data.comment,
    categories: data.categories,
  });

  // Update listing stats
  await updateListingStats(booking.listing._id);

  return review;
};

export const createDriverReview = async (userId, driverId, data) => {
  // Find a completed booking where user was host and driverId was the driver
  const booking = await Booking.findOne({
    _id: data.bookingId,
    driver: driverId,
    status: BOOKING_STATUS.COMPLETED,
  }).populate('listing');

  if (!booking) {
    throw new NotFoundError('Reserva no encontrada o no completada');
  }

  if (booking.listing.host.toString() !== userId) {
    throw new ForbiddenError('Solo el host puede reseñar al conductor de esta reserva');
  }

  // Check if review already exists
  const existingReview = await Review.findOne({
    booking: data.bookingId,
    reviewType: 'driver',
  });

  if (existingReview) {
    throw new ValidationError('Ya has reseñado este conductor para esta reserva');
  }

  const review = await Review.create({
    booking: data.bookingId,
    reviewType: 'driver',
    reviewer: userId,
    reviewee: driverId,
    rating: data.rating,
    comment: data.comment,
    categories: data.categories,
  });

  return review;
};

export const getHostReviews = async (hostId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const filter = {
    reviewee: hostId,
    reviewType: 'host',
    isPublic: true,
  };

  const reviews = await Review.find(filter)
    .populate('reviewer', 'firstName lastName avatar')
    .populate('listing', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Review.countDocuments(filter);

  return {
    reviews,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getDriverReviews = async (driverId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const filter = {
    reviewee: driverId,
    reviewType: 'driver',
    isPublic: true,
  };

  const reviews = await Review.find(filter)
    .populate('reviewer', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Review.countDocuments(filter);

  return {
    reviews,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getBookingReviews = async (userId, bookingId) => {
  const booking = await Booking.findById(bookingId).populate('listing');

  if (!booking) {
    throw new NotFoundError('Reserva no encontrada');
  }

  const isDriver = booking.driver.toString() === userId;
  const isHost = booking.listing.host.toString() === userId;

  if (!isDriver && !isHost) {
    throw new ForbiddenError('No tienes permiso para ver las reseñas de esta reserva');
  }

  const reviews = await Review.find({ booking: bookingId })
    .populate('reviewer', 'firstName lastName avatar')
    .populate('reviewee', 'firstName lastName avatar');

  return reviews;
};

const updateListingStats = async (listingId) => {
  const reviews = await Review.find({
    listing: listingId,
    isPublic: true,
  });

  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  await Listing.findByIdAndUpdate(listingId, {
    'stats.averageRating': Math.round(averageRating * 10) / 10,
    'stats.reviewCount': reviews.length,
  });
};

