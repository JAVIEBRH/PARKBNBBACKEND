import crypto from 'crypto';
import CalendarSync from '../../models/CalendarSync.js';
import Listing from '../../models/Listing.js';
import Booking from '../../models/Booking.js';
import { BOOKING_STATUS } from '../../utils/constants.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

const SUCCESS_STATUSES = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.ACTIVE,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.PAID_OUT,
];

const generateToken = () => crypto.randomBytes(24).toString('hex');

const escapeICS = (value = '') =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .trim();

const formatDateICS = (date) => {
  const iso = new Date(date).toISOString().replace(/[-:]/g, '');
  return `${iso.split('.')[0]}Z`;
};

const ensureCalendarSync = async (hostId) => {
  let sync = await CalendarSync.findOne({ host: hostId });
  if (!sync) {
    sync = await CalendarSync.create({
      host: hostId,
      token: generateToken(),
      lastGeneratedAt: new Date(),
    });
  }
  return sync;
};

export const getCalendarSettings = async (hostId) => {
  const sync = await ensureCalendarSync(hostId);
  return {
    token: sync.token,
    icsPath: `/v1/calendar/sync/${sync.token}.ics`,
    google: sync.google,
    lastGeneratedAt: sync.lastGeneratedAt,
    lastAccessAt: sync.lastAccessAt,
    updatedAt: sync.updatedAt,
  };
};

export const regenerateCalendarToken = async (hostId) => {
  const sync = await ensureCalendarSync(hostId);
  sync.token = generateToken();
  sync.lastGeneratedAt = new Date();
  await sync.save();

  return {
    token: sync.token,
    icsPath: `/v1/calendar/sync/${sync.token}.ics`,
    lastGeneratedAt: sync.lastGeneratedAt,
  };
};

const buildICSEntry = (booking, listing) => {
  const driverName = booking.driver
    ? `${booking.driver.firstName || ''} ${booking.driver.lastName || ''}`.trim()
    : 'Huésped';

  const summary = listing?.title
    ? `${listing.title} - ${driverName}`
    : `Reserva Parkbnb - ${driverName}`;

  const descriptionParts = [
    `Cliente: ${driverName}`,
    booking.pricing?.hostPayout ? `Payout: $${booking.pricing.hostPayout.toFixed(2)}` : null,
    booking.vehicle ? `Vehículo: ${booking.vehicle}` : null,
    booking.accessCode ? `Código de acceso: ${booking.accessCode}` : null,
  ].filter(Boolean);

  return [
    'BEGIN:VEVENT',
    `UID:${booking._id}@parkbnb`,
    `DTSTAMP:${formatDateICS(new Date())}`,
    `DTSTART:${formatDateICS(booking.startDate)}`,
    `DTEND:${formatDateICS(booking.endDate)}`,
    `SUMMARY:${escapeICS(summary)}`,
    listing?.address?.fullAddress
      ? `LOCATION:${escapeICS(listing.address.fullAddress)}`
      : '',
    descriptionParts.length ? `DESCRIPTION:${escapeICS(descriptionParts.join('\n'))}` : '',
    'END:VEVENT',
  ].filter(Boolean);
};

export const getCalendarFeedByToken = async (token, filters = {}) => {
  const sync = await CalendarSync.findOne({ token });
  if (!sync) {
    throw new NotFoundError('Calendario no encontrado');
  }

  const hostId = sync.host;
  const listings = await Listing.find({ host: hostId }).select('_id title address');
  if (!listings.length) {
    return {
      ics: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Parkbnb//Calendar//EN\r\nEND:VCALENDAR',
      listings: [],
    };
  }

  const listingIds = listings.map((listing) => listing._id);

  const filterListingId = filters.listingId;
  const listingFilter = filterListingId
    ? listingIds.filter((id) => id.toString() === filterListingId)
    : listingIds;

  if (!listingFilter.length) {
    throw new BadRequestError('Listing no válido para este calendario');
  }

  const bookings = await Booking.find({
    listing: { $in: listingFilter },
    status: { $in: SUCCESS_STATUSES },
  })
    .populate('driver', 'firstName lastName')
    .populate('listing', 'title address');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parkbnb//Host Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  bookings.forEach((booking) => {
    lines.push(...buildICSEntry(booking, booking.listing));
  });

  lines.push('END:VCALENDAR');

  sync.lastAccessAt = new Date();
  await sync.save();

  return {
    ics: lines.join('\r\n'),
    listings: listings.map((listing) => ({
      id: listing._id.toString(),
      title: listing.title,
    })),
  };
};

export const updateGoogleSyncSettings = async (hostId, { connected, accountEmail }) => {
  const sync = await ensureCalendarSync(hostId);
  sync.google.connected = Boolean(connected);
  sync.google.accountEmail = accountEmail || null;
  sync.google.syncEnabled = Boolean(connected);
  if (!connected) {
    sync.google.lastSyncedAt = null;
  }

  await sync.save();

  return {
    google: sync.google,
  };
};


