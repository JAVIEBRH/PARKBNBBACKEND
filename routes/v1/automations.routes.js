import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireHost } from '../../middlewares/roles.js';
import {
  getAutomations,
  createAutomationController,
  updateAutomationController,
  changeAutomationStatusController,
  deleteAutomationController,
} from '../../controllers/automations/automations.controller.js';

const router = Router();

router.use(requireAuth, requireHost);

router.get('/', getAutomations);
router.post('/', createAutomationController);
router.patch('/:automationId', updateAutomationController);
router.post('/:automationId/status', changeAutomationStatusController);
router.delete('/:automationId', deleteAutomationController);

export default router;


