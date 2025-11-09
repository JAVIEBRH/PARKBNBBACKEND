import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import {
  ALERT_STATUS,
} from '../../models/Alert.js';
import {
  getAlerts,
  getAlertById,
  createAlert,
  updateAlertStatus,
  bulkAcknowledgeAlerts,
  deleteAlert,
} from '../../services/alerts/alerts.service.js';

export const listAlerts = asyncHandler(async (req, res) => {
  const result = await getAlerts(req.query);
  successResponse(res, result.alerts, 'Alertas obtenidas', {
    ...result.meta,
    summary: result.summary,
  });
});

export const getAlert = asyncHandler(async (req, res) => {
  const alert = await getAlertById(req.params.alertId);
  successResponse(res, alert, 'Alerta obtenida');
});

export const createAlertController = asyncHandler(async (req, res) => {
  const alert = await createAlert(req.body);
  successResponse(res, alert, 'Alerta creada');
});

export const acknowledgeAlert = asyncHandler(async (req, res) => {
  const alert = await updateAlertStatus(req.params.alertId, {
    status: ALERT_STATUS.ACKNOWLEDGED,
    userId: req.user?._id,
  });
  successResponse(res, alert, 'Alerta marcada como reconocida');
});

export const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await updateAlertStatus(req.params.alertId, {
    status: ALERT_STATUS.RESOLVED,
    userId: req.user?._id,
  });
  successResponse(res, alert, 'Alerta resuelta');
});

export const reopenAlert = asyncHandler(async (req, res) => {
  const alert = await updateAlertStatus(req.params.alertId, {
    status: ALERT_STATUS.OPEN,
    userId: req.user?._id,
  });
  successResponse(res, alert, 'Alerta reabierta');
});

export const acknowledgeAlertsBulk = asyncHandler(async (req, res) => {
  const { ids = [] } = req.body;
  const result = await bulkAcknowledgeAlerts(ids, req.user?._id);
  successResponse(res, result, 'Alertas marcadas como reconocidas');
});

export const deleteAlertController = asyncHandler(async (req, res) => {
  await deleteAlert(req.params.alertId);
  successResponse(res, null, 'Alerta eliminada');
});


