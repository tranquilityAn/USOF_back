import commentRepo from '../repositories/CommentRepository.js';
import postRepo from '../repositories/PostRepository.js';

class CommentService {
    async getCommentsByPost(postId, { isAdmin = false } = {}) {
        return await commentRepo.findByPost(postId, { onlyActive: !isAdmin });
    }

    async getCommentById(id) {
        const comment = await commentRepo.findByIdPublic(id, { allowInactive: false });
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            throw err;
        }
        return comment;
    }

    async addComment(postId, userId, content) {
        if (!content) throw new Error('Content is required');
        return await commentRepo.create({ postId, authorId: userId, content });
    }

    async updateComment(commentId, user, fields) {
        const comment = await commentRepo.findById(commentId);
        if (!comment) {
            const e = new Error('Comment not found');
            e.status = 404; throw e;
        }

        const forbidden = Object.keys(fields).filter(k => k !== 'status');
        if (forbidden.length) {
            const e = new Error('Only "status" can be updated'); e.status = 403; throw e;
        }

        const { status } = fields || {};
        if (!status) { const e = new Error('status is required'); e.status = 400; throw e; }
        if (!['active', 'inactive'].includes(status)) {
            const e = new Error('Invalid status'); e.status = 400; throw e;
        }

        const isOwner = comment.authorId === user.id;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            const e = new Error('Forbidden'); e.status = 403; throw e;
        }

        return await commentRepo.updateStatus(commentId, status);
    }


    async deleteComment(commentId, userId) {
        const comment = await commentRepo.findById(commentId);
        if (!comment) throw new Error('Comment not found');

        if (comment.authorId !== userId) {
            throw new Error('Forbidden: not your comment');
        }

        await commentRepo.delete(commentId);
        return true;
    }

    async lockComment(postId, commentId, currentUser) {
        const post = await postRepo.findById(postId);
        if (!post) { const e = new Error('Post not found'); e.status = 404; throw e; }

        const isOwner = post.authorId === currentUser.id;
        const isAdmin = currentUser.role === 'admin';
        if (!isOwner && !isAdmin) { const e = new Error('Forbidden'); e.status = 403; throw e; }

        const comment = await commentRepo.findById(commentId);
        if (!comment || comment.postId !== postId) { const e = new Error('Comment not found'); e.status = 404; throw e; }

        await commentRepo.update(commentId, { locked: 1 });
        return await commentRepo.findById(commentId);
    }

    async unlockComment(postId, commentId, currentUser) {
        const post = await postRepo.findById(postId);
        if (!post) { const e = new Error('Post not found'); e.status = 404; throw e; }

        const isOwner = post.authorId === currentUser.id;
        const isAdmin = currentUser.role === 'admin';
        if (!isOwner && !isAdmin) { const e = new Error('Forbidden'); e.status = 403; throw e; }

        const comment = await commentRepo.findById(commentId);
        if (!comment || comment.postId !== postId) { const e = new Error('Comment not found'); e.status = 404; throw e; }

        await commentRepo.update(commentId, { locked: 0 });
        return await commentRepo.findById(commentId);
    }
}

export default new CommentService();