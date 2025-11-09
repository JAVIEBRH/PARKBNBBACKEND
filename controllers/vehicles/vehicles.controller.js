import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../../utils/response.js';
import * as vehiclesService from '../../services/vehicles/vehicles.service.js';

export const getVehicles = asyncHandler(async (req, res) => {
  const result = await vehiclesService.getVehicles(req.user._id, req.query);

  paginatedResponse(
    res,
    result.vehicles,
    result.meta.page,
    result.meta.limit,
    result.meta.total,
    'Vehículos obtenidos'
  );
});

export const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehiclesService.createVehicle(req.user._id, req.body);

  successResponse(res, { vehicle }, 'Vehículo creado');
});

export const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await vehiclesService.getVehicleById(req.params.vehicleId, req.user._id);

  successResponse(res, { vehicle }, 'Vehículo obtenido');
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehiclesService.updateVehicle(
    req.params.vehicleId,
    req.user._id,
    req.body
  );

  successResponse(res, { vehicle }, 'Vehículo actualizado');
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  await vehiclesService.deleteVehicle(req.params.vehicleId, req.user._id);

  successResponse(res, null, 'Vehículo eliminado');
});

export const addPhoto = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.photo) {
    throw new Error('No se proporcionó foto');
  }

  const vehicle = await vehiclesService.addPhoto(
    req.params.vehicleId,
    req.user._id,
    req.files.photo
  );

  successResponse(res, { vehicle }, 'Foto agregada');
});

export const deletePhoto = asyncHandler(async (req, res) => {
  await vehiclesService.deletePhoto(req.params.vehicleId, req.params.photoId, req.user._id);

  successResponse(res, null, 'Foto eliminada');
});

