const express = require('express');
const PostController = require('../controllers/PostController');
//const authMiddleware = require('../middlewares/authMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { optionalAuth } = require('../middlewares/authMiddleware');
const commentRoutes = require('./commentRoutes');
const likeRoutes = require('./likeRoutes');

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

module.exports = router;

