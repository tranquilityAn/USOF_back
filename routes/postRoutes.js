import express from 'express';
import PostController from '../controllers/PostController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';
import commentRoutes from './commentRoutes.js';
import likeRoutes from './likeRoutes.js';

const router = express.Router({ mergeParams: true });

router.param('post_id', (req, res, next, val) => {
    if (!/^\d+$/.test(val)) {
        return res.status(400).json({ error: 'post_id must be an integer' });
    }
    next();
});

router.get('/', optionalAuth, PostController.getAllPosts); 
router.get('/:post_id/categories', PostController.getCategories);
router.use('/:post_id/comments', commentRoutes);
router.get('/:post_id', optionalAuth, PostController.getPost);

router.post('/', authMiddleware, PostController.createPost);
router.patch('/:post_id', authMiddleware, PostController.updatePost);
router.delete('/:post_id', authMiddleware, PostController.deletePost);
router.post('/:post_id/lock', authMiddleware, PostController.lock);
router.delete('/:post_id/lock', authMiddleware, PostController.unlock);

router.use('/:post_id/like', (req, res, next) => {
    req.entityType = 'post';
    req.entityId = Number(req.params.post_id);
    next();
}, likeRoutes);

export default router;
