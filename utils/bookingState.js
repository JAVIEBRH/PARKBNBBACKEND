import { BOOKING_STATUS } from './constants.js';

export const canTransition = (currentStatus, newStatus) => {
  const transitions = {
    [BOOKING_STATUS.DRAFT]: [BOOKING_STATUS.PENDING_APPROVAL, BOOKING_STATUS.CONFIRMED],
    [BOOKING_STATUS.PENDING_APPROVAL]: [
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.DECLINED,
      BOOKING_STATUS.CANCELLED,
    ],
    [BOOKING_STATUS.CONFIRMED]: [
      BOOKING_STATUS.ACTIVE,
      BOOKING_STATUS.CANCELLED,
      BOOKING_STATUS.NO_SHOW,
    ],
    [BOOKING_STATUS.ACTIVE]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.DISPUTED],
    [BOOKING_STATUS.COMPLETED]: [BOOKING_STATUS.PAID_OUT, BOOKING_STATUS.DISPUTED],
    [BOOKING_STATUS.PAID_OUT]: [],
    [BOOKING_STATUS.DECLINED]: [],
    [BOOKING_STATUS.CANCELLED]: [],
    [BOOKING_STATUS.NO_SHOW]: [],
    [BOOKING_STATUS.DISPUTED]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
  };

  return transitions[currentStatus]?.includes(newStatus) || false;
};

export const getNextStates = (currentStatus) => {
  const transitions = {
    [BOOKING_STATUS.DRAFT]: [BOOKING_STATUS.PENDING_APPROVAL, BOOKING_STATUS.CONFIRMED],
    [BOOKING_STATUS.PENDING_APPROVAL]: [
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.DECLINED,
      BOOKING_STATUS.CANCELLED,
    ],
    [BOOKING_STATUS.CONFIRMED]: [
      BOOKING_STATUS.ACTIVE,
      BOOKING_STATUS.CANCELLED,
      BOOKING_STATUS.NO_SHOW,
    ],
    [BOOKING_STATUS.ACTIVE]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.DISPUTED],
    [BOOKING_STATUS.COMPLETED]: [BOOKING_STATUS.PAID_OUT, BOOKING_STATUS.DISPUTED],
    [BOOKING_STATUS.PAID_OUT]: [],
    [BOOKING_STATUS.DECLINED]: [],
    [BOOKING_STATUS.CANCELLED]: [],
    [BOOKING_STATUS.NO_SHOW]: [],
    [BOOKING_STATUS.DISPUTED]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
  };

  return transitions[currentStatus] || [];
};

export const requiresHostApproval = (listing) => {
  return listing.requiresApproval === true;
};

export const canCheckIn = (booking, now = new Date()) => {
  if (booking.status !== BOOKING_STATUS.CONFIRMED) return false;

  const startTime = new Date(booking.startDate);
  const earlyCheckInWindow = 15 * 60 * 1000; // 15 minutos antes

  return now >= startTime - earlyCheckInWindow;
};

export const canCheckOut = (booking, now = new Date()) => {
  if (booking.status !== BOOKING_STATUS.ACTIVE) return false;
  return true;
};

export const isOverstay = (booking, now = new Date()) => {
  const endTime = new Date(booking.endDate);
  const graceMinutes = 15 * 60 * 1000; // 15 minutos de gracia

  return now > endTime + graceMinutes;
};

export const calculateOverstayHours = (booking, now = new Date()) => {
  const endTime = new Date(booking.endDate);
  const graceMinutes = 15 * 60 * 1000;

  if (now <= endTime + graceMinutes) return 0;

  const overstayMs = now - (endTime + graceMinutes);
  const overstayHours = Math.ceil(overstayMs / (1000 * 60 * 60));

  return overstayHours;
};

