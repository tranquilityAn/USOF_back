import express from 'express';
import UserController from '../controllers/UserController.js';
import { authMiddleware, roleMiddleware, selfOrRole } from '../middlewares/authMiddleware.js';
import { avatarUpload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Получить конкретного пользователя
router.get('/:user_id', UserController.getById);

// Все маршруты ниже требуют авторизации
router.use(authMiddleware);

// Получить всех пользователей — только для админов
router.get('/', roleMiddleware(['admin']), UserController.getAll);

// Создать нового пользователя — только для админов
router.post('/', roleMiddleware(['admin']), UserController.create);

// Обновить аватар
router.patch('/avatar',
    authMiddleware,
    avatarUpload.single('avatar'),
    UserController.updateAvatar
);

// Обновить данные пользователя
router.patch('/:user_id', UserController.update);

// Удалить пользователя
router.delete('/:user_id', selfOrRole(['admin']), UserController.delete);

export default router;