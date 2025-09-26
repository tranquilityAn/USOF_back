import express from 'express';
import LikeController from '../controllers/LikeController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', (req, res, next) => LikeController.getLikes(req, res, next));
router.post('/', authMiddleware, (req, res, next) => LikeController.addLike(req, res, next));
router.delete('/', authMiddleware, (req, res, next) => LikeController.removeLike(req, res, next));

export default router;