import CommentService from '../services/CommentService.js';

class CommentController {
    async getComments(req, res, next) {
        try {
            const postId = Number(req.params.post_id);
            const page = Number(req.query.page ?? 1);
            const limit = Number(req.query.limit ?? 20);
            const isAdmin = req.user?.role === 'admin';
            const data = await CommentService.getTopLevel(postId, { page, limit, isAdmin });
            res.json({
                ...data,
                items: data.items.map(c => c.toJSON()),
            });
        } catch (err) { next(err); }
    }

    async getReplies(req, res, next) {
        try {
            const postId = Number(req.params.post_id);
            const commentId = Number(req.params.comment_id);
            const page = Number(req.query.page ?? 1);
            const limit = Number(req.query.limit ?? 20);
            const isAdmin = req.user?.role === 'admin';
            const data = await CommentService.getReplies(postId, commentId, { page, limit, isAdmin });
            res.json(data);
        } catch (err) { next(err); }
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
            const postId = Number(req.params.post_id);
            const { content, parentId = null } = req.body ?? {};
            const created = await CommentService.addComment(postId, { content, parentId }, req.user);
            res.status(201).json(created.toJSON());
        } catch (err) { next(err); }
    }

    async updateComment(req, res, next) {
        try {
            const commentId = Number(req.params.comment_id);
            const result = await CommentService.updateComment(commentId, req.user, {
                status: req.body.status,
            });
            res.json(result.toJSON());
        } catch (err) {
            res.status(err.status || 500).json({ message: err.message || 'Internal error' });
        }
    }

    async deleteComment(req, res, next) {
        try {
            const { comment_id } = req.params;
            await CommentService.deleteComment(Number(comment_id), req.user);
            res.json({ message: 'Comment deleted successfully' });
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

export default new CommentController();