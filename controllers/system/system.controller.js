import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import * as systemService from '../../services/system/system.service.js';

export const getHealth = asyncHandler(async (req, res) => {
  const health = await systemService.getHealth();

  successResponse(res, health, 'Sistema saludable');
});

export const getVersion = asyncHandler(async (req, res) => {
  const version = await systemService.getVersion();

  successResponse(res, version, 'Versión obtenida');
});

export const getTime = asyncHandler(async (req, res) => {
  const time = await systemService.getServerTime();

  successResponse(res, time, 'Hora del servidor');
});

export const getConfig = asyncHandler(async (req, res) => {
  const config = await systemService.getConfig();

  successResponse(res, config, 'Configuración obtenida');
});

