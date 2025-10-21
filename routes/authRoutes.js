import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);

// email verification
router.get('/verify-email/:token', AuthController.verifyEmail);

// password reset
router.post('/password-reset', AuthController.requestPasswordReset);

// JSON-перевірка токена (опційно, зручно для фронта)
router.get('/password-reset/:token/validate', AuthController.validatePasswordResetToken);
// встановлення нового пароля
router.post('/password-reset/:token', AuthController.confirmPasswordReset);
// (не обов'язково, але корисно) якщо користувач випадково відкриє API-лінк GET /password-reset/:token,
// можемо чемно редіректнути на фронт, щоб не ловити "Cannot GET ..."
router.get('/password-reset/:token', AuthController.redirectPasswordResetToFrontend);
// routes/authRoutes.js
router.get('/verify-email/:token/redirect', AuthController.redirectVerifyToFrontend);

export default router;