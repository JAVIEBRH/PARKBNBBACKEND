import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireHost } from '../../middlewares/roles.js';
import { getHostDashboard } from '../../controllers/reports/hostReports.controller.js';

const router = Router();

router.get('/host/dashboard', requireAuth, requireHost, getHostDashboard);

export default router;


