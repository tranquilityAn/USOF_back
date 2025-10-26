import express from 'express';
import UserController from '../controllers/UserController.js';
import { authMiddleware, roleMiddleware, selfOrRole } from '../middlewares/authMiddleware.js';
import { avatarUpload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// login search
router.get('/by-login/:login', UserController.getByLoginPublic);

// get user
router.get('/:user_id', UserController.getById);

// Authorization required
router.use(authMiddleware);

// all users (only admin)
router.get('/', roleMiddleware(['admin']), UserController.getAll);

// create user (only admin)
router.post('/', roleMiddleware(['admin']), UserController.create);

// updt avatar
router.patch('/avatar',
    authMiddleware,
    avatarUpload.single('avatar'),
    UserController.updateAvatar
);

// updt user data
router.patch('/:user_id', UserController.update);

// delete user
router.delete('/:user_id', selfOrRole(['admin']), UserController.delete);

export default router;