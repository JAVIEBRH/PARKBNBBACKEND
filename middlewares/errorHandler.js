import { AppError } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';
import { createLogger } from '../libs/logger.js';

const logger = createLogger('ErrorHandler');

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  if (err.statusCode >= 500 || !err.isOperational) {
    logger.error(`${req.method} ${req.originalUrl}`, {
      error: err.message,
      stack: err.stack,
      body: req.body,
      user: req.user?._id,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new AppError('Recurso no encontrado', 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`El campo '${field}' ya existe`, 409);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = new AppError('Errores de validación', 400, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token inválido', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expirado', 401);
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Error interno del servidor';
  const errors = error.errors || null;

  return errorResponse(res, message, statusCode, errors);
};

