const express = require('express');
const PostController = require('../controllers/PostController');
//const authMiddleware = require('../middlewares/authMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { optionalAuth } = require('../middlewares/authMiddleware');
const commentRoutes = require('./commentRoutes');
const likeRoutes = require('./likeRoutes');

const router = express.Router({ mergeParams: true });

// --- PUBLIC ROUTES ---
router.get('/', optionalAuth,PostController.getAllPosts);                // GET /api/posts
router.get('/:post_id', PostController.getPost);            // GET /api/posts/:post_id
//router.get('/:post_id/comments', PostController.getComments); 
router.get('/:post_id/categories', PostController.getCategories); // GET /api/posts/:post_id/categories
//router.get('/:post_id/like', PostController.getLikes);      // GET /api/posts/:post_id/like

router.use('/:post_id/comments', commentRoutes); // GET /api/posts/:post_id/comments
//router.use('/:post_id/like', likeRoutes);
//router.use('/:post_id/comments', commentRoutes); // POST /api/posts/:post_id/comments
//router.use('/:post_id/like', likeRoutes); // POST api/posts/:post_id/likes
//router.use('/:post_id/like', likeRoutes); // DELETE api/posts/:post_id/like

// --- PROTECTED ROUTES (требует JWT) ---
router.post('/', authMiddleware, PostController.createPost); // POST /api/posts
//router.post('/:post_id/comments', authMiddleware, PostController.addComment); // POST /api/posts/:post_id/comments
// moved to commentRoutes ^
//router.post('/:post_id/like', authMiddleware, PostController.likePost); // POST /api/posts/:post_id/like
//router.delete('/:post_id/like', authMiddleware, PostController.unlikePost); // DELETE /api/posts/:post_id/like
router.patch('/:post_id', authMiddleware, PostController.updatePost); // PATCH /api/posts/:post_id 
router.delete('/:post_id', authMiddleware, PostController.deletePost); // DELETE /api/posts/:post_id

router.use("/:post_id/like", (req, res, next) => {
    req.entityType = "post";
    req.entityId = Number(req.params.post_id);
    next();
}, likeRoutes);

module.exports = router;

