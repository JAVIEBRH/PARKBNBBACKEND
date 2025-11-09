import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import * as authService from '../../services/auth/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  successResponse(res, result, 'Usuario registrado exitosamente');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  successResponse(res, result, 'Inicio de sesión exitoso');
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  await authService.logout(req.user._id, refreshToken);

  successResponse(res, null, 'Cierre de sesión exitoso');
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  const result = await authService.refreshAccessToken(refreshToken);

  successResponse(res, result, 'Token renovado exitosamente');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  await authService.requestPasswordReset(email);

  successResponse(
    res,
    null,
    'Si el email existe, recibirás un enlace para restablecer tu contraseña'
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  await authService.resetPassword(token, password);

  successResponse(res, null, 'Contraseña restablecida exitosamente');
});

export const requestEmailVerification = asyncHandler(async (req, res) => {
  await authService.requestEmailVerification(req.user._id);

  successResponse(res, null, 'Email de verificación enviado');
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  await authService.verifyEmail(token);

  successResponse(res, null, 'Email verificado exitosamente');
});

export const enable2FA = asyncHandler(async (req, res) => {
  const result = await authService.enable2FA(req.user._id);

  successResponse(res, result, '2FA habilitado. Escanea el código QR con tu app.');
});

export const verify2FA = asyncHandler(async (req, res) => {
  const { token } = req.body;

  await authService.verify2FA(req.user._id, token);

  successResponse(res, null, '2FA verificado exitosamente');
});

export const disable2FA = asyncHandler(async (req, res) => {
  await authService.disable2FA(req.user._id);

  successResponse(res, null, '2FA deshabilitado exitosamente');
});

