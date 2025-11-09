import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import * as usersService from '../../services/users/users.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await usersService.getMe(req.user._id);

  successResponse(res, { user }, 'Perfil obtenido');
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await usersService.updateMe(req.user._id, req.body);

  successResponse(res, { user }, 'Perfil actualizado');
});

export const deleteMe = asyncHandler(async (req, res) => {
  await usersService.deleteMe(req.user._id);

  successResponse(res, null, 'Cuenta eliminada');
});

export const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await usersService.getPreferences(req.user._id);

  successResponse(res, { preferences }, 'Preferencias obtenidas');
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await usersService.updatePreferences(req.user._id, req.body);

  successResponse(res, { preferences }, 'Preferencias actualizadas');
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.avatar) {
    throw new Error('No se proporcionó archivo');
  }

  const avatar = await usersService.uploadAvatar(req.user._id, req.files.avatar);

  successResponse(res, { avatar }, 'Avatar subido');
});

export const deleteAvatar = asyncHandler(async (req, res) => {
  await usersService.deleteAvatar(req.user._id);

  successResponse(res, null, 'Avatar eliminado');
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await usersService.getUserById(req.params.userId, req.user?._id);

  successResponse(res, { user }, 'Usuario obtenido');
});

export const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await usersService.getPublicProfile(req.params.userId);

  successResponse(res, { user }, 'Perfil público obtenido');
});

export const blockUser = asyncHandler(async (req, res) => {
  await usersService.blockUser(req.user._id, req.params.userId);

  successResponse(res, null, 'Usuario bloqueado');
});

export const unblockUser = asyncHandler(async (req, res) => {
  await usersService.unblockUser(req.user._id, req.params.userId);

  successResponse(res, null, 'Usuario desbloqueado');
});

