import Payout from '../../models/Payout.js';
import Booking from '../../models/Booking.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { PAYOUT_STATUS, BOOKING_STATUS } from '../../utils/constants.js';
import { addDays } from '../../utils/dateTime.js';
import { getPaginationParams } from '../../utils/pagination.js';

export const getPayouts = async (userId, query) => {
  const { page, limit, skip, sort } = getPaginationParams(query);

  const filter = { host: userId };

  if (query.status) {
    filter.status = query.status;
  }

  const payouts = await Payout.find(filter)
    .populate('booking', 'startDate endDate pricing')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Payout.countDocuments(filter);

  return {
    payouts,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPayoutById = async (userId, payoutId) => {
  const payout = await Payout.findById(payoutId).populate('booking');

  if (!payout) {
    throw new NotFoundError('Payout no encontrado');
  }

  if (payout.host.toString() !== userId) {
    throw new ForbiddenError('No tienes permiso para ver este payout');
  }

  return payout;
};

export const schedulePayout = async (bookingId) => {
  const booking = await Booking.findById(bookingId).populate('listing');

  if (!booking) {
    throw new NotFoundError('Reserva no encontrada');
  }

  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw new Error('La reserva debe estar completada para programar el payout');
  }

  // Check if payout already exists
  const existingPayout = await Payout.findOne({ booking: bookingId });

  if (existingPayout) {
    return existingPayout;
  }

  const delayDays = parseInt(process.env.HOST_PAYOUT_DELAY_DAYS || '2', 10);
  const scheduledFor = addDays(new Date(), delayDays);

  const payout = await Payout.create({
    host: booking.listing.host,
    booking: bookingId,
    amount: booking.pricing.hostPayout,
    currency: booking.pricing.currency || 'USD',
    status: PAYOUT_STATUS.SCHEDULED,
    scheduledFor,
  });

  booking.payout = payout._id;
  await booking.save();

  return payout;
};

export const getSummary = async (userId) => {
  const pending = await Payout.aggregate([
    {
      $match: {
        host: userId,
        status: { $in: [PAYOUT_STATUS.PENDING, PAYOUT_STATUS.SCHEDULED] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const completed = await Payout.aggregate([
    {
      $match: {
        host: userId,
        status: PAYOUT_STATUS.COMPLETED,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    pending: pending[0] || { total: 0, count: 0 },
    completed: completed[0] || { total: 0, count: 0 },
  };
};

