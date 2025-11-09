import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireHost } from '../../middlewares/roles.js';
import {
  listTeamMembers,
  inviteTeamMemberController,
  updateTeamMemberController,
  changeTeamMemberStatusController,
  resendTeamInvitationController,
  removeTeamMemberController,
} from '../../controllers/team/team.controller.js';

const router = Router();

router.use(requireAuth, requireHost);

router.get('/', listTeamMembers);
router.post('/invite', inviteTeamMemberController);
router.patch('/:memberId', updateTeamMemberController);
router.post('/:memberId/status', changeTeamMemberStatusController);
router.post('/:memberId/resend', resendTeamInvitationController);
router.delete('/:memberId', removeTeamMemberController);

export default router;


