import { Resend } from 'resend';
import { createLogger } from './logger.js';

const logger = createLogger('Resend');

let resendClient = null;

if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!resendClient) {
    logger.warn('Resend API key no configurada. Email no enviado (modo mock).');
    logger.info(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
    return { success: true, mode: 'mock' };
  }

  try {
    const result = await resendClient.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@parkbnb.com',
      to,
      subject,
      html,
      text,
    });

    logger.info(`Email enviado a ${to}: ${subject}`);
    return { success: true, messageId: result.id };
  } catch (error) {
    logger.error('Error enviando email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: `¡Bienvenido a ${process.env.APP_NAME || 'Parkbnb'}!`,
    html: `<h1>Hola ${user.firstName},</h1><p>Gracias por registrarte en Parkbnb.</p>`,
    text: `Hola ${user.firstName}, Gracias por registrarte en Parkbnb.`,
  });
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  return sendEmail({
    to: user.email,
    subject: 'Restablecer contraseña - Parkbnb',
    html: `<p>Hola ${user.firstName},</p><p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${resetUrl}">${resetUrl}</a>`,
    text: `Hola ${user.firstName}, Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetUrl}`,
  });
};

export const sendEmailVerification = async (user, verificationToken) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  return sendEmail({
    to: user.email,
    subject: 'Verifica tu email - Parkbnb',
    html: `<p>Hola ${user.firstName},</p><p>Haz clic en el siguiente enlace para verificar tu email:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
    text: `Hola ${user.firstName}, Haz clic en el siguiente enlace para verificar tu email: ${verifyUrl}`,
  });
};

export const sendBookingConfirmation = async (booking, user) => {
  return sendEmail({
    to: user.email,
    subject: 'Confirmación de reserva - Parkbnb',
    html: `<p>Tu reserva #${booking._id} ha sido confirmada.</p>`,
    text: `Tu reserva #${booking._id} ha sido confirmada.`,
  });
};

