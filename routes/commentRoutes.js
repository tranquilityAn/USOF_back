const express = require('express');
const CommentController = require('../controllers/CommentController');
//const authMiddleware = require('../middlewares/authMiddleware');
const { authMiddleware, optionalAuth } = require('../middlewares/authMiddleware');
const likeRoutes = require('./likeRoutes');

const router = express.Router({ mergeParams: true }); 


// --- PUBLIC ---
router.get('/', optionalAuth, CommentController.getComments); // GET /api/posts/:post_id/comments
//router.get('/:comment_id', CommentController.getComment);
router.get('/:comment_id', optionalAuth, CommentController.getComment); // GET /api/comments/:comment_id

// --- PROTECTED ---
router.post('/', authMiddleware, CommentController.addComment);
//router.post('/posts/:post_id/comments', authMiddleware, CommentController.addComment); // POST
router.patch('/:comment_id', authMiddleware, CommentController.updateComment);
//router.patch('/comments/:comment_id', authMiddleware, CommentController.updateComment); // PATCH
router.delete('/:comment_id', authMiddleware, CommentController.deleteComment);
//router.delete('/comments/:comment_id', authMiddleware, CommentController.deleteComment); // DELETE

// вложенные лайки комментария: /api/comments/:comment_id/likes
router.use("/:comment_id/like", (req, res, next) => {
  req.entityType = "comment";
  req.entityId = Number(req.params.comment_id);
  next();
}, likeRoutes);

module.exports = router;
