import crypto from 'crypto';
import HostTeamMember, {
  TEAM_PERMISSIONS,
  TEAM_ROLES,
  TEAM_STATUS,
} from '../../models/HostTeamMember.js';
import User from '../../models/User.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

const ROLE_PRESETS = {
  [TEAM_ROLES.COHOST]: [
    'manageListings',
    'manageBookings',
    'manageFinance',
    'manageMessages',
    'viewAnalytics',
    'manageAutomations',
    'manageDocuments',
  ],
  [TEAM_ROLES.MANAGER]: [
    'manageListings',
    'manageBookings',
    'manageMessages',
    'viewAnalytics',
    'manageAutomations',
  ],
  [TEAM_ROLES.STAFF]: ['manageBookings', 'manageMessages', 'manageDocuments'],
};

const normalizeEmail = (email) => email?.trim().toLowerCase();

const sanitizeMember = (member) => ({
  id: member._id.toString(),
  email: member.email,
  role: member.role,
  status: member.status,
  permissions: member.permissions || [],
  invitedAt: member.invitedAt,
  invitedBy: member.invitedBy
    ? {
      id: member.invitedBy._id?.toString() || member.invitedBy.id,
      name:
        `${member.invitedBy.firstName || ''} ${member.invitedBy.lastName || ''}`.trim() || null,
      email: member.invitedBy.email || null,
    }
    : null,
  acceptedAt: member.acceptedAt,
  revokedAt: member.revokedAt,
  lastActiveAt: member.lastActiveAt,
  notes: member.notes,
  user: member.user
    ? {
      id: member.user._id?.toString() || member.user.id,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      roles: member.user.roles,
    }
    : null,
});

export const getTeamMembers = async (hostId) => {
  const members = await HostTeamMember.find({ host: hostId })
    .populate('user', 'firstName lastName roles email')
    .populate('invitedBy', 'firstName lastName email');

  const sanitized = members.map(sanitizeMember);
  const summary = sanitized.reduce(
    (acc, member) => {
      acc.total += 1;
      if (member.status === TEAM_STATUS.ACTIVE) acc.active += 1;
      if (member.status === TEAM_STATUS.INVITED) acc.pending += 1;
      return acc;
    },
    { total: 0, active: 0, pending: 0 }
  );

  return {
    members: sanitized,
    summary,
    rolePresets: ROLE_PRESETS,
    permissionsCatalog: TEAM_PERMISSIONS,
  };
};

const resolveExistingUser = async (email) => {
  if (!email) return null;
  const user = await User.findOne({ email }).select('firstName lastName roles email');
  return user || null;
};

export const inviteTeamMember = async ({ hostId, invitedById, email, role, permissions, notes }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new BadRequestError('El email del invitado es requerido');
  }

  const existingMember = await HostTeamMember.findOne({ host: hostId, email: normalizedEmail });
  if (existingMember && existingMember.status === TEAM_STATUS.ACTIVE) {
    throw new BadRequestError('Este correo ya pertenece a un miembro activo del equipo');
  }

  const selectedRole = Object.values(TEAM_ROLES).includes(role) ? role : TEAM_ROLES.COHOST;
  const defaultPermissions = ROLE_PRESETS[selectedRole] || [];
  const sanitizedPermissions =
    permissions?.length > 0
      ? permissions.filter((permission) => TEAM_PERMISSIONS.includes(permission))
      : defaultPermissions;

  const token = crypto.randomBytes(24).toString('hex');
  const existingUser = await resolveExistingUser(normalizedEmail);

  const member = existingMember || new HostTeamMember({
    host: hostId,
    email: normalizedEmail,
  });

  member.role = selectedRole;
  member.permissions = sanitizedPermissions;
  member.status = TEAM_STATUS.INVITED;
  member.invitationToken = token;
  member.invitedBy = invitedById;
  member.invitedAt = new Date();
  member.notes = notes;
  member.user = existingUser?._id || null;
  member.revokedAt = null;
  member.acceptedAt = null;

  member.auditTrail.push({
    action: existingMember ? 'reinvite' : 'invite',
    by: invitedById,
    payload: {
      role: selectedRole,
      permissions: sanitizedPermissions,
    },
  });

  await member.save();

  // TODO: Integrar envío de correo real utilizando libs/resend.js

  return sanitizeMember(member);
};

export const updateTeamMember = async (memberId, hostId, payload, actorId) => {
  const member = await HostTeamMember.findOne({ _id: memberId, host: hostId });
  if (!member) {
    throw new NotFoundError('Miembro del equipo no encontrado');
  }

  if (payload.role && Object.values(TEAM_ROLES).includes(payload.role)) {
    member.role = payload.role;
  }

  if (payload.permissions) {
    const filtered = payload.permissions.filter((permission) =>
      TEAM_PERMISSIONS.includes(permission)
    );
    member.permissions = filtered.length ? filtered : member.permissions;
  }

  if (typeof payload.notes === 'string') {
    member.notes = payload.notes;
  }

  member.auditTrail.push({
    action: 'update',
    by: actorId,
    payload: {
      role: member.role,
      permissions: member.permissions,
      notes: member.notes,
    },
  });

  await member.save();
  await member.populate([
    { path: 'user', select: 'firstName lastName roles email' },
    { path: 'invitedBy', select: 'firstName lastName email' },
  ]);

  return sanitizeMember(member);
};

export const changeTeamMemberStatus = async ({ memberId, hostId, status, actorId }) => {
  if (!Object.values(TEAM_STATUS).includes(status)) {
    throw new BadRequestError('Estado inválido para el miembro del equipo');
  }

  const member = await HostTeamMember.findOne({ _id: memberId, host: hostId });
  if (!member) {
    throw new NotFoundError('Miembro del equipo no encontrado');
  }

  member.status = status;
  if (status === TEAM_STATUS.ACTIVE) {
    member.acceptedAt = new Date();
  }
  if (status === TEAM_STATUS.REVOKED) {
    member.revokedAt = new Date();
  }

  member.auditTrail.push({
    action: 'status_change',
    by: actorId,
    payload: { status },
  });

  await member.save();
  await member.populate([
    { path: 'user', select: 'firstName lastName roles email' },
    { path: 'invitedBy', select: 'firstName lastName email' },
  ]);

  return sanitizeMember(member);
};

export const resendTeamInvitation = async ({ memberId, hostId, actorId }) => {
  const member = await HostTeamMember.findOne({ _id: memberId, host: hostId });
  if (!member) {
    throw new NotFoundError('Miembro del equipo no encontrado');
  }

  if (member.status !== TEAM_STATUS.INVITED) {
    throw new BadRequestError('Solo se puede reenviar invitaciones pendientes');
  }

  member.invitedAt = new Date();
  member.invitationToken = crypto.randomBytes(24).toString('hex');
  member.auditTrail.push({
    action: 'resend_invitation',
    by: actorId,
  });

  await member.save();

  // TODO: Integrar envío de correo real

  return sanitizeMember(member);
};

export const removeTeamMember = async ({ memberId, hostId, actorId }) => {
  const member = await HostTeamMember.findOne({ _id: memberId, host: hostId });
  if (!member) {
    throw new NotFoundError('Miembro del equipo no encontrado');
  }

  await HostTeamMember.deleteOne({ _id: memberId, host: hostId });

  return {
    id: memberId,
    removed: true,
    audit: {
      action: 'remove',
      by: actorId,
    },
  };
};



