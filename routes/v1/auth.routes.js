import { Router } from 'express';
import * as authController from '../../controllers/auth/auth.controller.js';
import { requireAuth } from '../../middlewares/auth.js';
import { authRateLimiter } from '../../config/rateLimit.js';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario registrado exitosamente
 */
router.post('/register', authRateLimiter, authController.register);

router.post('/login', authRateLimiter, authController.login);
router.post('/logout', requireAuth, authController.logout);
router.post('/refresh', authController.refresh);

router.post('/password/forgot', authRateLimiter, authController.forgotPassword);
router.post('/password/reset', authController.resetPassword);

router.post('/email/verify/request', requireAuth, authController.requestEmailVerification);
router.post('/email/verify/confirm', authController.verifyEmail);

router.post('/2fa/enable', requireAuth, authController.enable2FA);
router.post('/2fa/verify', requireAuth, authController.verify2FA);
router.delete('/2fa/disable', requireAuth, authController.disable2FA);

export default router;

