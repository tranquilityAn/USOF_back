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

    async getTopLevel(postId, { page = 1, limit = 20, isAdmin = false } = {}) {
        const onlyActive = !isAdmin;
        const offset = (page - 1) * limit;
        const [items, total] = await Promise.all([
            commentRepo.findTopLevelByPost(postId, { limit, offset, onlyActive }),
            commentRepo.countTopLevelByPost(postId, { onlyActive }),
        ]);
        return { items, total, page, limit };
    }

    async getReplies(postId, commentId, { page = 1, limit = 20, isAdmin = false } = {}) {
        const offset = (page - 1) * limit;
        const onlyActive = !isAdmin;

        const [items, total] = await Promise.all([
            commentRepo.findReplies(postId, commentId, { limit, offset, onlyActive }),
            commentRepo.countReplies(postId, commentId, { onlyActive }),
        ]);

        return {
            items: items.map(c => c.toJSON()),
            total,
            page,
            limit,
        };
    }

    async addComment(postId, { content, parentId }, currentUser) {
        if (!content || !content.trim()) {
            const e = new Error('Content is required'); e.status = 400; throw e;
        }

        const post = await postRepo.findById(postId);
        if (!post) { const e = new Error('Post not found'); e.status = 404; throw e; }

        if (parentId != null) {
            const parent = await commentRepo.findById(parentId);
            if (!parent || parent.postId !== postId) {
                const e = new Error('Invalid parentId'); e.status = 400; throw e;
            }
        }

        const created = await commentRepo.create({
            postId,
            authorId: currentUser.id,
            content: content.trim(),
            parentId: parentId ?? null,
        });

        return created;
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

    async deleteComment(commentId, currentUser) {
        const comment = await commentRepo.findById(commentId);
        if (!comment) { const e = new Error('Comment not found'); e.status = 404; throw e; }

        const isOwner = comment.authorId === currentUser.id;
        const isAdmin = currentUser.role === 'admin';
        if (!isOwner && !isAdmin) { const e = new Error('Forbidden'); e.status = 403; throw e; }

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