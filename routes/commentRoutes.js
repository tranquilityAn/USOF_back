import express from 'express';
import CommentController from '../controllers/CommentController.js';
import { authMiddleware, optionalAuth} from '../middlewares/authMiddleware.js';
import likeRoutes from './likeRoutes.js';

const router = express.Router({ mergeParams: true }); 

router.get('/', optionalAuth, CommentController.getComments); // top-level
router.get('/:comment_id/replies', optionalAuth, CommentController.getReplies); // 

// --- PUBLIC ---
router.get('/', optionalAuth, CommentController.getComments); // GET /api/posts/:post_id/comments
router.get('/:comment_id', optionalAuth, CommentController.getComment); // GET /api/comments/:comment_id

// --- PROTECTED ---
router.post('/', authMiddleware, CommentController.addComment);
router.patch('/:comment_id', authMiddleware, CommentController.updateComment);
router.delete('/:comment_id', authMiddleware, CommentController.deleteComment);
router.post('/:comment_id/lock', authMiddleware, CommentController.lock); // /api/posts/:post_id/comments/:comment_id/lock
router.delete('/:comment_id/lock', authMiddleware, CommentController.unlock);

// /api/comments/:comment_id/likes
router.use('/:comment_id/like', (req, res, next) => {
  req.entityType = 'comment';
  req.entityId = Number(req.params.comment_id);
  next();
}, likeRoutes);

export default router;