import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import User from '../../models/User.js';
import { UnauthorizedError, NotFoundError, ConflictError } from '../../utils/errors.js';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
} from '../../libs/resend.js';

export const register = async (data) => {
  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    throw new ConflictError('El email ya está registrado');
  }

  const user = await User.create({
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    roles: data.roles || ['driver'],
  });

  // Send welcome email
  await sendWelcomeEmail(user).catch((err) => console.error('Error sending welcome email:', err));

  const tokens = generateTokens(user);

  // Save refresh token
  user.refreshTokens.push({
    token: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await user.save();

  return { user: user.toObject(), ...tokens };
};

export const login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  if (user.isBanned) {
    throw new UnauthorizedError('Usuario suspendido');
  }

  user.lastLogin = new Date();
  await user.save();

  const tokens = generateTokens(user);

  // Save refresh token
  user.refreshTokens.push({
    token: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await user.save();

  return { user: user.toObject(), ...tokens };
};

export const logout = async (userId, refreshToken) => {
  const user = await User.findById(userId);

  if (user && refreshToken) {
    user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== refreshToken);
    await user.save();
  }

  return { success: true };
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token no proporcionado');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado');
    }

    // Verify refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some((rt) => rt.token === refreshToken);

    if (!tokenExists) {
      throw new UnauthorizedError('Refresh token inválido');
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return { accessToken };
  } catch (error) {
    throw new UnauthorizedError('Refresh token inválido o expirado');
  }
};

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists
    return { success: true };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 3600000; // 1 hour

  await user.save();

  await sendPasswordResetEmail(user, resetToken).catch((err) =>
    console.error('Error sending reset email:', err)
  );

  return { success: true };
};

export const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new UnauthorizedError('Token inválido o expirado');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all sessions

  await user.save();

  return { success: true };
};

export const requestEmailVerification = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  if (user.isEmailVerified) {
    throw new ConflictError('Email ya verificado');
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  await user.save();

  await sendEmailVerification(user, verificationToken).catch((err) =>
    console.error('Error sending verification email:', err)
  );

  return { success: true };
};

export const verifyEmail = async (token) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({ emailVerificationToken: hashedToken });

  if (!user) {
    throw new UnauthorizedError('Token inválido');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;

  await user.save();

  return { success: true };
};

export const enable2FA = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const secret = speakeasy.generateSecret({
    name: `${process.env.APP_NAME} (${user.email})`,
  });

  user.twoFactorSecret = secret.base32;
  await user.save();

  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url,
  };
};

export const verify2FA = async (userId, token) => {
  const user = await User.findById(userId).select('+twoFactorSecret');

  if (!user || !user.twoFactorSecret) {
    throw new NotFoundError('2FA no configurado');
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
  });

  if (!verified) {
    throw new UnauthorizedError('Código 2FA inválido');
  }

  user.twoFactorEnabled = true;
  await user.save();

  return { success: true };
};

export const disable2FA = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;

  await user.save();

  return { success: true };
};

const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

