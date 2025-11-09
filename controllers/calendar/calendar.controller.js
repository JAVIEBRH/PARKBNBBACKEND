import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import {
  getCalendarSettings,
  regenerateCalendarToken,
  updateGoogleSyncSettings,
  getCalendarFeedByToken,
} from '../../services/calendar/calendar.service.js';

export const getCalendarSyncSettingsController = asyncHandler(async (req, res) => {
  const settings = await getCalendarSettings(req.user._id);
  successResponse(res, settings, 'Configuración de calendario');
});

export const regenerateCalendarTokenController = asyncHandler(async (req, res) => {
  const tokenInfo = await regenerateCalendarToken(req.user._id);
  successResponse(res, tokenInfo, 'Token de calendario regenerado');
});

export const updateGoogleSyncController = asyncHandler(async (req, res) => {
  const result = await updateGoogleSyncSettings(req.user._id, req.body);
  successResponse(res, result, 'Preferencias de sincronización actualizadas');
});

export const getCalendarFeedController = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { listingId } = req.query;
  const { ics } = await getCalendarFeedByToken(token, { listingId });

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="parkbnb-${token.substring(0, 6)}.ics"`
  );
  res.send(ics);
});

export default {
  getCalendarSyncSettingsController,
  regenerateCalendarTokenController,
  updateGoogleSyncController,
  getCalendarFeedController,
};


