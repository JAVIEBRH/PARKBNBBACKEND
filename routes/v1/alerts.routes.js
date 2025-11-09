import { Router } from 'express';
import {
  acknowledgeAlert,
  acknowledgeAlertsBulk,
  createAlertController,
  deleteAlertController,
  listAlerts,
  getAlert,
  reopenAlert,
  resolveAlert,
} from '../../controllers/alerts/alerts.controller.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

router
  .route('/')
  .get(requireAuth, listAlerts)
  .post(requireAuth, createAlertController);

router.post('/bulk/acknowledge', requireAuth, acknowledgeAlertsBulk);

router
  .route('/:alertId')
  .get(requireAuth, getAlert)
  .delete(requireAuth, deleteAlertController);

router.post('/:alertId/acknowledge', requireAuth, acknowledgeAlert);
router.post('/:alertId/resolve', requireAuth, resolveAlert);
router.post('/:alertId/reopen', requireAuth, reopenAlert);

export default router;


