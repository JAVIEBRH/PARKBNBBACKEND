import { Router } from 'express';
import * as systemController from '../../controllers/system/system.controller.js';

const router = Router();

router.get('/health', systemController.getHealth);
router.get('/version', systemController.getVersion);
router.get('/time', systemController.getTime);
router.get('/config', systemController.getConfig);

export default router;

