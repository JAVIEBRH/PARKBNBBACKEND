import { ROLES } from './constants.js';

export const hasRole = (user, role) => {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
};

export const hasAnyRole = (user, roles) => {
  if (!user || !user.roles) return false;
  return roles.some((role) => user.roles.includes(role));
};

export const hasAllRoles = (user, roles) => {
  if (!user || !user.roles) return false;
  return roles.every((role) => user.roles.includes(role));
};

export const isAdmin = (user) => {
  return hasRole(user, ROLES.ADMIN);
};

export const isHost = (user) => {
  return hasRole(user, ROLES.HOST);
};

export const isDriver = (user) => {
  return hasRole(user, ROLES.DRIVER);
};

export const canManageBooking = (user, booking) => {
  if (isAdmin(user)) return true;
  if (booking.driver?.toString() === user._id.toString()) return true;
  if (booking.listing?.host?.toString() === user._id.toString()) return true;
  return false;
};

export const canManageListing = (user, listing) => {
  if (isAdmin(user)) return true;
  if (listing.host?.toString() === user._id.toString()) return true;
  return false;
};

