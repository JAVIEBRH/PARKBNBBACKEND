import { ForbiddenError } from '../utils/errors.js';

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Acceso denegado'));
    }

    const hasRole = roles.some((role) => req.user.roles.includes(role));

    if (!hasRole) {
      return next(
        new ForbiddenError(`Se requiere uno de los siguientes roles: ${roles.join(', ')}`)
      );
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireHost = requireRole('host', 'admin');
export const requireDriver = requireRole('driver', 'admin');

