import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import {
  getTeamMembers,
  inviteTeamMember,
  updateTeamMember,
  changeTeamMemberStatus,
  resendTeamInvitation,
  removeTeamMember,
} from '../../services/team/team.service.js';

export const listTeamMembers = asyncHandler(async (req, res) => {
  const data = await getTeamMembers(req.user._id);
  successResponse(res, data, 'Equipo obtenido');
});

export const inviteTeamMemberController = asyncHandler(async (req, res) => {
  const { email, role, permissions, notes } = req.body;
  const member = await inviteTeamMember({
    hostId: req.user._id,
    invitedById: req.user._id,
    email,
    role,
    permissions,
    notes,
  });
  successResponse(res, member, 'Invitación enviada');
});

export const updateTeamMemberController = asyncHandler(async (req, res) => {
  const { role, permissions, notes } = req.body;
  const member = await updateTeamMember(req.params.memberId, req.user._id, { role, permissions, notes }, req.user._id);
  successResponse(res, member, 'Miembro actualizado');
});

export const changeTeamMemberStatusController = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const member = await changeTeamMemberStatus({
    memberId: req.params.memberId,
    hostId: req.user._id,
    status,
    actorId: req.user._id,
  });
  successResponse(res, member, 'Estado actualizado');
});

export const resendTeamInvitationController = asyncHandler(async (req, res) => {
  const member = await resendTeamInvitation({
    memberId: req.params.memberId,
    hostId: req.user._id,
    actorId: req.user._id,
  });
  successResponse(res, member, 'Invitación reenviada');
});

export const removeTeamMemberController = asyncHandler(async (req, res) => {
  const result = await removeTeamMember({
    memberId: req.params.memberId,
    hostId: req.user._id,
    actorId: req.user._id,
  });
  successResponse(res, result, 'Miembro eliminado');
});

export default {
  listTeamMembers,
  inviteTeamMemberController,
  updateTeamMemberController,
  changeTeamMemberStatusController,
  resendTeamInvitationController,
  removeTeamMemberController,
};


