import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import {
  listAutomations,
  createAutomation,
  updateAutomation,
  changeAutomationStatus,
  deleteAutomation,
} from '../../services/automations/automations.service.js';

export const getAutomations = asyncHandler(async (req, res) => {
  const data = await listAutomations(req.user._id);
  successResponse(res, data, 'Automatizaciones obtenidas');
});

export const createAutomationController = asyncHandler(async (req, res) => {
  const automation = await createAutomation({
    hostId: req.user._id,
    userId: req.user._id,
    payload: req.body,
  });
  successResponse(res, automation, 'Automatización creada');
});

export const updateAutomationController = asyncHandler(async (req, res) => {
  const automation = await updateAutomation({
    automationId: req.params.automationId,
    hostId: req.user._id,
    userId: req.user._id,
    payload: req.body,
  });
  successResponse(res, automation, 'Automatización actualizada');
});

export const changeAutomationStatusController = asyncHandler(async (req, res) => {
  const automation = await changeAutomationStatus({
    automationId: req.params.automationId,
    hostId: req.user._id,
    userId: req.user._id,
    status: req.body.status,
  });
  successResponse(res, automation, 'Estado actualizado');
});

export const deleteAutomationController = asyncHandler(async (req, res) => {
  const result = await deleteAutomation({
    automationId: req.params.automationId,
    hostId: req.user._id,
  });
  successResponse(res, result, 'Automatización eliminada');
});

export default {
  getAutomations,
  createAutomationController,
  updateAutomationController,
  changeAutomationStatusController,
  deleteAutomationController,
};


