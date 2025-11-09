import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import * as paymentsService from '../../services/payments/payments.service.js';

export const createIntent = asyncHandler(async (req, res) => {
  const result = await paymentsService.createPaymentIntent(req.user._id, req.body.bookingId);

  successResponse(res, result, 'Intención de pago creada');
});

export const capture = asyncHandler(async (req, res) => {
  const payment = await paymentsService.capturePayment(req.user._id, req.params.paymentId);

  successResponse(res, { payment }, 'Pago capturado');
});

export const cancel = asyncHandler(async (req, res) => {
  const payment = await paymentsService.cancelPayment(req.user._id, req.params.paymentId);

  successResponse(res, { payment }, 'Pago cancelado');
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await paymentsService.getPaymentById(req.user._id, req.params.paymentId);

  successResponse(res, { payment }, 'Pago obtenido');
});

export const getReceipt = asyncHandler(async (req, res) => {
  const receipt = await paymentsService.getReceipt(req.user._id, req.params.paymentId);

  successResponse(res, receipt, 'Recibo obtenido');
});

export const getMethods = asyncHandler(async (req, res) => {
  const methods = await paymentsService.getPaymentMethods(req.user._id);

  successResponse(res, { methods }, 'Métodos de pago obtenidos');
});

export const addMethod = asyncHandler(async (req, res) => {
  const method = await paymentsService.addPaymentMethod(req.user._id, req.body);

  successResponse(res, { method }, 'Método de pago agregado');
});

export const deleteMethod = asyncHandler(async (req, res) => {
  await paymentsService.deletePaymentMethod(req.user._id, req.params.methodId);

  successResponse(res, null, 'Método de pago eliminado');
});

