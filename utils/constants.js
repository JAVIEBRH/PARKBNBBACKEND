export const ROLES = {
  DRIVER: 'driver',
  HOST: 'host',
  ADMIN: 'admin',
};

export const BOOKING_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pendingApproval',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAID_OUT: 'paidOut',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  NO_SHOW: 'noShow',
  DISPUTED: 'disputed',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  INTENT_CREATED: 'intentCreated',
  CAPTURED: 'captured',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const PAYOUT_STATUS = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const KYC_STATUS = {
  NOT_STARTED: 'notStarted',
  PENDING: 'pending',
  IN_REVIEW: 'inReview',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const VEHICLE_TYPES = {
  SEDAN: 'sedan',
  SUV: 'suv',
  TRUCK: 'truck',
  VAN: 'van',
  MOTORCYCLE: 'motorcycle',
  OTHER: 'other',
};

export const LISTING_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
  SUSPENDED: 'suspended',
};

export const LISTING_TYPES = {
  OUTDOOR: 'outdoor',
  INDOOR: 'indoor',
  COVERED: 'covered',
  GARAGE: 'garage',
  STREET: 'street',
};

export const INCIDENT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'inProgress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const NOTIFICATION_TYPES = {
  BOOKING: 'booking',
  PAYMENT: 'payment',
  MESSAGE: 'message',
  REVIEW: 'review',
  SYSTEM: 'system',
};

export const AMENITIES = [
  'covered',
  'security24h',
  'cctv',
  'electricCharger',
  'handicapAccess',
  'lighting',
  'gated',
  'attendant',
  'carWash',
];

export const PRICING_TYPES = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

export const TRANSACTION_TYPES = {
  TOPUP: 'topup',
  PAYMENT: 'payment',
  REFUND: 'refund',
  PAYOUT: 'payout',
  TRANSFER: 'transfer',
  FEE: 'fee',
};

