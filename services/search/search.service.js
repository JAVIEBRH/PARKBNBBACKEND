import Listing from '../../models/Listing.js';
import { LISTING_STATUS } from '../../utils/constants.js';
import { getPaginationParams } from '../../utils/pagination.js';
import { estimatePrice } from '../../utils/pricing.js';

export const search = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const filter = { status: LISTING_STATUS.PUBLISHED };

  // Text search
  if (query.q) {
    filter.$or = [
      { title: { $regex: query.q, $options: 'i' } },
      { description: { $regex: query.q, $options: 'i' } },
      { 'address.city': { $regex: query.q, $options: 'i' } },
    ];
  }

  // Geospatial search
  if (query.lat && query.lng) {
    const maxDistance = query.radius ? parseInt(query.radius, 10) * 1000 : 10000; // meters

    filter['address.approximateLocation'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(query.lng), parseFloat(query.lat)],
        },
        $maxDistance: maxDistance,
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

  // Listing type
  if (query.type) {
    filter.type = query.type;
  }

  const sortOptions = {};
  if (query.sortBy === 'price') {
    sortOptions['pricing.hourlyRate'] = query.order === 'desc' ? -1 : 1;
  } else if (query.sortBy === 'rating') {
    sortOptions['stats.averageRating'] = -1;
  } else {
    sortOptions.createdAt = -1;
  }

  const listings = await Listing.find(filter)
    .populate('host', 'firstName lastName avatar')
    .sort(sortOptions)
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

export const searchSuggest = async (query) => {
  const suggestions = await Listing.find({
    status: LISTING_STATUS.PUBLISHED,
    $or: [
      { title: { $regex: query.q, $options: 'i' } },
      { 'address.city': { $regex: query.q, $options: 'i' } },
    ],
  })
    .select('title address.city')
    .limit(10)
    .lean();

  return suggestions;
};

export const searchNearby = async (lat, lng, radius = 5) => {
  const listings = await Listing.find({
    status: LISTING_STATUS.PUBLISHED,
    'address.approximateLocation': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: radius * 1000, // km to meters
      },
    },
  })
    .populate('host', 'firstName lastName avatar')
    .limit(20)
    .lean();

  return listings;
};

export const estimatePricing = async (listingId, startDate, endDate) => {
  const listing = await Listing.findById(listingId);

  if (!listing || listing.status !== LISTING_STATUS.PUBLISHED) {
    throw new Error('Listing no encontrado o no disponible');
  }

  const pricing = estimatePrice(listing, new Date(startDate), new Date(endDate), null);

  return pricing;
};

export const getListingPreview = async (listingId) => {
  const listing = await Listing.findById(listingId)
    .select('title description type address pricing amenities photos stats')
    .populate('host', 'firstName lastName avatar stats')
    .lean();

  if (!listing || listing.status !== LISTING_STATUS.PUBLISHED) {
    throw new Error('Listing no encontrado o no disponible');
  }

  return listing;
};

