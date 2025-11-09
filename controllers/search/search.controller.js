import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../../utils/response.js';
import * as searchService from '../../services/search/search.service.js';

export const search = asyncHandler(async (req, res) => {
  const result = await searchService.search(req.query);

  paginatedResponse(
    res,
    result.listings,
    result.meta.page,
    result.meta.limit,
    result.meta.total,
    'Búsqueda completada'
  );
});

export const suggest = asyncHandler(async (req, res) => {
  const suggestions = await searchService.searchSuggest(req.query);

  successResponse(res, { suggestions }, 'Sugerencias obtenidas');
});

export const nearby = asyncHandler(async (req, res) => {
  const { lat, lng, radius } = req.body;

  const listings = await searchService.searchNearby(lat, lng, radius);

  successResponse(res, { listings }, 'Listings cercanos obtenidos');
});

export const estimate = asyncHandler(async (req, res) => {
  const { listingId, startDate, endDate } = req.body;

  const pricing = await searchService.estimatePricing(listingId, startDate, endDate);

  successResponse(res, { pricing }, 'Precio estimado');
});

export const getPreview = asyncHandler(async (req, res) => {
  const listing = await searchService.getListingPreview(req.params.listingId);

  successResponse(res, { listing }, 'Preview obtenido');
});

