import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     description: Цей маршрут дозволяє створити новий обліковий запис.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *               - passwordConfirmation
 *               - email
 *             properties:
 *               login:
 *                 type: string
 *                 example: newuser
 *               password:
 *                 type: string
 *                 format: password
 *                 example: strongpass123
 *               passwordConfirmation:
 *                 type: string
 *                 format: password
 *                 example: strongpass123
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               fullName:
 *                 type: string
 *                 example: New User
 *     responses:
 *       201:
 *         description: Користувач успішно зареєстрований.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Неправильні дані або паролі не співпадають.
 *       409:
 *         description: Користувач з таким логіном уже існує.
 */
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

export default router;