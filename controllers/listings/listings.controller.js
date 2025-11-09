import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../../utils/response.js';
import * as listingsService from '../../services/listings/listings.service.js';

export const getListings = asyncHandler(async (req, res) => {
  const result = await listingsService.getListings(req.query, req.user?._id);

  paginatedResponse(
    res,
    result.listings,
    result.meta.page,
    result.meta.limit,
    result.meta.total,
    'Listings obtenidos'
  );
});

export const createListing = asyncHandler(async (req, res) => {
  const listing = await listingsService.createListing(req.user._id, req.body);

  successResponse(res, { listing }, 'Listing creado');
});

export const getListingById = asyncHandler(async (req, res) => {
  const listing = await listingsService.getListingById(req.params.listingId, req.user?._id);

  successResponse(res, { listing }, 'Listing obtenido');
});

export const updateListing = asyncHandler(async (req, res) => {
  const listing = await listingsService.updateListing(
    req.params.listingId,
    req.user._id,
    req.body
  );

  successResponse(res, { listing }, 'Listing actualizado');
});

export const deleteListing = asyncHandler(async (req, res) => {
  await listingsService.deleteListing(req.params.listingId, req.user._id);

  successResponse(res, null, 'Listing eliminado');
});

export const publishListing = asyncHandler(async (req, res) => {
  const listing = await listingsService.publishListing(req.params.listingId, req.user._id);

  successResponse(res, { listing }, 'Listing publicado');
});

export const unpublishListing = asyncHandler(async (req, res) => {
  const listing = await listingsService.unpublishListing(req.params.listingId, req.user._id);

  successResponse(res, { listing }, 'Listing despublicado');
});

export const addPhoto = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.photo) {
    throw new Error('No se proporcionó foto');
  }

  const listing = await listingsService.addPhoto(
    req.params.listingId,
    req.user._id,
    req.files.photo,
    req.body.caption
  );

  successResponse(res, { listing }, 'Foto agregada');
});

export const deletePhoto = asyncHandler(async (req, res) => {
  await listingsService.deletePhoto(req.params.listingId, req.params.photoId, req.user._id);

  successResponse(res, null, 'Foto eliminada');
});

export const getAmenities = asyncHandler(async (req, res) => {
  const listing = await listingsService.getListingById(req.params.listingId, req.user?._id);

  successResponse(res, { amenities: listing.amenities }, 'Amenities obtenidos');
});

export const updateAmenities = asyncHandler(async (req, res) => {
  const listing = await listingsService.updateAmenities(
    req.params.listingId,
    req.user._id,
    req.body.amenities
  );

  successResponse(res, { listing }, 'Amenities actualizados');
});

