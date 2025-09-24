const CommentService = require("../services/CommentService");

class CommentController {
    async getComments(req, res, next) {
        try {
            const { post_id } = req.params;
            const isAdmin = req.user?.role === 'admin';
            const comments = await CommentService.getCommentsByPost(post_id, { isAdmin });
            res.json(comments.map(c => c.toJSON()));
        } catch (err) {
            next(err);
        }
    }

    async getComment(req, res, next) {
        try {
            const { comment_id } = req.params;
            const comment = await CommentService.getCommentById(comment_id);
            res.json(comment.toJSON());
        } catch (err) {
            next(err);
        }
    }

    async addComment(req, res, next) {
        try {
            const { post_id } = req.params;
            const { content } = req.body;
            const comment = await CommentService.addComment(post_id, req.user.id, content);
            res.status(201).json(comment.toJSON());
        } catch (err) {
            next(err);
        }
    }

    async updateComment(req, res, next) {
        try {
            const commentId = Number(req.params.comment_id);
            const result = await CommentService.updateComment(commentId, req.user, {
                status: req.body.status,
            });
            res.json(result);
        } catch (err) {
            res.status(err.status || 500).json({ message: err.message || 'Internal error' });
        }
    }

    async deleteComment(req, res, next) {
        try {
            const { comment_id } = req.params;
            await CommentService.deleteComment(comment_id, req.user.id);
            res.json({ message: "Comment deleted successfully" });
        } catch (err) {
            next(err);
        }
    }

    async lock(req, res, next) {
        try {
            const { post_id, comment_id } = req.params;
            const postId = Number(post_id);
            const commentId = Number(comment_id);
            if (!Number.isInteger(postId) || !Number.isInteger(commentId)) {
                const err = new Error('Invalid post_id or comment_id'); err.status = 400; throw e;
            }
            const c = await CommentService.lockComment(postId, commentId, req.user);
            res.json(c);
        } catch (err) {
            next(err);
        }
    }

    async unlock(req, res, next) {
        try {
            const { post_id, comment_id } = req.params;
            const postId = Number(post_id);
            const commentId = Number(comment_id);
            if (!Number.isInteger(postId) || !Number.isInteger(commentId)) {
                const err = new Error('Invalid post_id or comment_id'); err.status = 400; throw e;
            }
            const c = await CommentService.unlockComment(postId, commentId, req.user);
            res.json(c);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new CommentController();
