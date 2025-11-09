import User from '../../models/User.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { uploadImage, deleteImage } from '../../libs/storage/cloudinary.js';

export const getMe = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  return user;
};

export const updateMe = async (userId, data) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Fields that can be updated
  const allowedFields = ['firstName', 'lastName', 'phone', 'preferences'];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      if (field === 'preferences' && user.preferences) {
        user.preferences = { ...user.preferences.toObject(), ...data[field] };
      } else {
        user[field] = data[field];
      }
    }
  });

  await user.save();

  return user;
};

export const deleteMe = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Soft delete: mark as banned
  user.isBanned = true;
  user.bannedReason = 'User requested deletion';
  user.bannedAt = new Date();

  await user.save();

  return { success: true };
};

export const getPreferences = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  return user.preferences;
};

export const updatePreferences = async (userId, preferences) => {
  const user = await User.findById(userId);
 
   if (!user) {
     throw new NotFoundError('Usuario no encontrado');
   }
 
  const current = user.preferences
    ? typeof user.preferences.toObject === 'function'
      ? user.preferences.toObject()
      : user.preferences
    : {};

  user.preferences = { ...current, ...preferences };
 
  await user.save();
 
  return user.preferences;
};

export const uploadAvatar = async (userId, file) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Delete old avatar if exists
  if (user.avatar?.publicId) {
    await deleteImage(user.avatar.publicId).catch((err) =>
      console.error('Error deleting old avatar:', err)
    );
  }

  const result = await uploadImage(file.buffer, 'avatars');

  user.avatar = {
    url: result.url,
    publicId: result.publicId,
  };

  await user.save();

  return user.avatar;
};

export const deleteAvatar = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  if (user.avatar?.publicId) {
    await deleteImage(user.avatar.publicId).catch((err) =>
      console.error('Error deleting avatar:', err)
    );
  }

  user.avatar = undefined;

  await user.save();

  return { success: true };
};

export const getUserById = async (userId, requesterId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Return full profile if it's the same user
  if (userId === requesterId) {
    return user;
  }

  // Return public profile for others
  return user.getPublicProfile();
};

export const getPublicProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  return user.getPublicProfile();
};

export const blockUser = async (userId, blockedUserId) => {
  if (userId === blockedUserId) {
    throw new ForbiddenError('No puedes bloquearte a ti mismo');
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  if (!user.blockedUsers.includes(blockedUserId)) {
    user.blockedUsers.push(blockedUserId);
    await user.save();
  }

  return { success: true };
};

export const unblockUser = async (userId, blockedUserId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== blockedUserId);
  await user.save();

  return { success: true };
};

