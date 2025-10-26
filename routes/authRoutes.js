import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/verify-email/:token', AuthController.verifyEmail);
router.post('/password-reset', AuthController.requestPasswordReset);
router.get('/password-reset/:token/validate', AuthController.validatePasswordResetToken);
router.post('/password-reset/:token', AuthController.confirmPasswordReset);
router.get('/password-reset/:token', AuthController.redirectPasswordResetToFrontend);
router.get('/verify-email/:token/redirect', AuthController.redirectVerifyToFrontend);
router.post('/verify-email/resend', AuthController.resendEmailVerification);
router.post('/verify-email/change', AuthController.changeEmail);
router.get('/verify-email/ttl', AuthController.getVerifyEmailTtl);


export default router;