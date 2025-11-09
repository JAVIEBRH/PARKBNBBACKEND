import { Router } from 'express';
import * as usersController from '../../controllers/users/users.controller.js';
import { requireAuth, optionalAuth } from '../../middlewares/auth.js';

const router = Router();

router.get('/me', requireAuth, usersController.getMe);
router.patch('/me', requireAuth, usersController.updateMe);
router.delete('/me', requireAuth, usersController.deleteMe);

router.get('/me/preferences', requireAuth, usersController.getPreferences);
router.patch('/me/preferences', requireAuth, usersController.updatePreferences);

router.post('/me/avatar', requireAuth, usersController.uploadAvatar);
router.delete('/me/avatar', requireAuth, usersController.deleteAvatar);

router.get('/:userId', optionalAuth, usersController.getUserById);
router.get('/:userId/public', usersController.getPublicProfile);

router.post('/me/block/:userId', requireAuth, usersController.blockUser);
router.delete('/me/block/:userId', requireAuth, usersController.unblockUser);

export default router;

