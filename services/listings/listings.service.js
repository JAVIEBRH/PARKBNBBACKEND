import Listing from '../../models/Listing.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import { canManageListing } from '../../utils/roles.js';
import { uploadImage, deleteImage } from '../../libs/storage/cloudinary.js';
import { getPaginationParams } from '../../utils/pagination.js';
import { LISTING_STATUS } from '../../utils/constants.js';

export const getListings = async (query, userId = null) => {
  const { page, limit, skip, sort } = getPaginationParams(query);

  const filter = {};

  // If userId provided, filter by host
  if (query.hostId) {
    filter.host = query.hostId;
  }

  // Filter by status (public only if not owner)
  if (userId && filter.host === userId) {
    // Owner can see all their listings
  } else {
    filter.status = LISTING_STATUS.PUBLISHED;
  }

  // Filter by city
  if (query.city) {
    filter['address.city'] = new RegExp(query.city, 'i');
  }

  const listings = await Listing.find(filter)
    .populate('host', 'firstName lastName avatar')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Listing.countDocuments(filter);

  return {
    listings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createListing = async (userId, data) => {
  const listing = await Listing.create({
    ...data,
    host: userId,
    status: LISTING_STATUS.DRAFT,
  });

  return listing;
};

export const getListingById = async (listingId, userId = null) => {
  const listing = await Listing.findById(listingId).populate('host', 'firstName lastName avatar');

  if (!listing) {
    throw new NotFoundError('Listing no encontrado');
  }

  // If not published, only owner or admin can see
  if (listing.status !== LISTING_STATUS.PUBLISHED) {
    if (!userId || !canManageListing({ _id: userId }, listing)) {
      throw new ForbiddenError('No tienes permiso para ver este listing');
    }
  }

  // Increment views
  listing.stats.views += 1;
  await listing.save();

  return listing;
};

export const updateListing = async (listingId, userId, data) => {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    throw new NotFoundError('Listing no encontrado');
  }

  if (!canManageListing({ _id: userId }, listing)) {
    throw new ForbiddenError('No tienes permiso para actualizar este listing');
  }

  Object.assign(listing, data);

  await listing.save();

  return listing;
};

export const deleteListing = async (listingId, userId) => {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    throw new NotFoundError('Listing no encontrado');
  }

  if (!canManageListing({ _id: userId }, listing)) {
    throw new ForbiddenError('No tienes permiso para eliminar este listing');
  }

  await listing.deleteOne();

  return { success: true };
};

export const publishListing = async (listingId, userId) => {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    throw new NotFoundError('Listing no encontrado');
  }

  if (!canManageListing({ _id: userId }, listing)) {
    throw new ForbiddenError('No tienes permiso para publicar este listing');
  }

  if (listing.status === LISTING_STATUS.PUBLISHED) {
    throw new ValidationError('El listing ya está publicado');
  }

  listing.status = LISTING_STATUS.PUBLISHED;
  listing.publishedAt = new Date();

  await listing.save();

  return listing;
};

export const unpublishListing = async (listingId, userId) => {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    throw new NotFoundError('Listing no encontrado');
  }

  if (!canManageListing({ _id: userId }, listing)) {
    throw new ForbiddenError('No tienes permiso para despublicar este listing');
  }

  listing.status = LISTING_STATUS.UNPUBLISHED;

  await listing.save();

  return listing;
};

export const addPhoto = async (listingId, userId, file, caption = '') => {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    throw new NotFoundError('Listing no encontrado');
  }

  if (!canManageListing({ _id: userId }, listing)) {
    throw new ForbiddenError('No tienes permiso para agregar fotos a este listing');
  }

  const result = await uploadImage(file.buffer, 'listings');

  listing.photos.push({
    url: result.url,
    publicId: result.publicId,
    caption,
    order: listing.photos.length,
  });

  await listing.save();

  return listing;
};

export const deletePhoto = async (listingId, photoId, userId) => {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    throw new NotFoundError('Listing no encontrado');
  }

  if (!canManageListing({ _id: userId }, listing)) {
    throw new ForbiddenError('No tienes permiso para eliminar fotos de este listing');
  }

  const photo = listing.photos.id(photoId);

  if (!photo) {
    throw new NotFoundError('Foto no encontrada');
  }

  if (photo.publicId) {
    await deleteImage(photo.publicId).catch((err) => console.error('Error deleting photo:', err));
  }

  listing.photos.pull(photoId);

  await listing.save();

  return { success: true };
};

export const updateAmenities = async (listingId, userId, amenities) => {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    throw new NotFoundError('Listing no encontrado');
  }

  if (!canManageListing({ _id: userId }, listing)) {
    throw new ForbiddenError('No tienes permiso para actualizar amenities de este listing');
  }

  listing.amenities = amenities;

  await listing.save();

  return listing;
};

export const searchListings = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const filter = { status: LISTING_STATUS.PUBLISHED };

  // Geospatial search
  if (query.lat && query.lng && query.radius) {
    filter['address.approximateLocation'] = {
      $geoWithin: {
        $centerSphere: [[parseFloat(query.lng), parseFloat(query.lat)], query.radius / 6371], // km to radians
      },
    };
  }

  // Price range
  if (query.minPrice) {
    filter['pricing.hourlyRate'] = { $gte: parseFloat(query.minPrice) };
  }
  if (query.maxPrice) {
    filter['pricing.hourlyRate'] = {
      ...filter['pricing.hourlyRate'],
      $lte: parseFloat(query.maxPrice),
    };
  }

  // Amenities
  if (query.amenities) {
    const amenitiesArray = query.amenities.split(',');
    filter.amenities = { $all: amenitiesArray };
  }

  const listings = await Listing.find(filter)
    .populate('host', 'firstName lastName avatar')
    .sort({ 'stats.averageRating': -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Listing.countDocuments(filter);

  return {
    listings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

