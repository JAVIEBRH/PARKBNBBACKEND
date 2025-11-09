import { Router } from 'express';
import * as paymentsController from '../../controllers/payments/payments.controller.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/methods', paymentsController.getMethods);
router.post('/methods', paymentsController.addMethod);
router.delete('/methods/:methodId', paymentsController.deleteMethod);

router.post('/intent', paymentsController.createIntent);
router.post('/capture/:paymentId', paymentsController.capture);
router.post('/cancel/:paymentId', paymentsController.cancel);

router.get('/:paymentId', paymentsController.getPayment);
router.get('/receipts/:paymentId', paymentsController.getReceipt);

export default router;

