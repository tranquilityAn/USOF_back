const express = require('express');
const UserController = require('../controllers/UserController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Все маршруты ниже требуют авторизации
router.use(authMiddleware);

// Получить всех пользователей — только для админов
router.get('/', roleMiddleware(['admin']), UserController.getAll);

// Получить конкретного пользователя
router.get('/:user_id', UserController.getById);

// Создать нового пользователя — только для админов
router.post('/', roleMiddleware(['admin']), UserController.create);

// Обновить данные пользователя
router.patch('/:user_id', UserController.update);

// Удалить пользователя
router.delete('/:user_id', roleMiddleware(['admin']), UserController.delete);

// Обновить аватар
router.patch('/avatar', UserController.updateAvatar);

module.exports = router;
