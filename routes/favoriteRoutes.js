import express from 'express';
import FavoriteController from '../controllers/FavoriteController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, (req, res, next) => FavoriteController.listMyFavorites(req, res, next));
router.post('/:post_id', authMiddleware, (req, res, next) => FavoriteController.add(req, res, next));
router.delete('/:post_id', authMiddleware, (req, res, next) => FavoriteController.remove(req, res, next));

export default router;