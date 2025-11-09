import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireHost } from '../../middlewares/roles.js';
import {
  getCalendarFeedController,
  getCalendarSyncSettingsController,
  regenerateCalendarTokenController,
  updateGoogleSyncController,
} from '../../controllers/calendar/calendar.controller.js';

const router = Router();

router.get('/sync/:token.ics', getCalendarFeedController);

router.use(requireAuth, requireHost);

router.get('/sync', getCalendarSyncSettingsController);
router.post('/sync/token', regenerateCalendarTokenController);
router.post('/sync/google', updateGoogleSyncController);

export default router;


