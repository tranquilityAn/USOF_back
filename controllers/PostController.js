import PostService from '../services/PostService.js';

class PostController {
    async getAllPosts(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                sort = 'date',     // 'date' | 'likes'
                order = 'desc',    // 'asc' | 'desc'
                categories,
                dateFrom,
                dateTo,
                status,
                authorId,
            } = req.query;

            const sortMap = { date: 'date', likes: 'likes' };
            const sortBy = sortMap[sort] || 'date';
            const sortOrder = (order || '').toLowerCase() === 'asc' ? 'asc' : 'desc';

            const categoryIds = categories
                ? String(categories).split(',').map(Number).filter(Boolean)
                : [];

            const filters = {
                categoryIds,
                dateFrom: dateFrom || null,
                dateTo: dateTo || null,
                status: status || null,
            };
            if (authorId) {
                const parsed = Number(authorId);
                if (!Number.isNaN(parsed)) filters.authorId = parsed;
            }

            const isAdmin = req.user?.role === 'admin';
            const currentUserId = req.user?.id || null;

            const { items, total } = await PostService.getAllPosts({
                page: Number(page),
                limit: Number(limit),
                isAdmin,
                currentUserId,
                sortBy: sort,
                sortOrder: order,
                filters,
            });

            return res.json({ items, total, page: Number(page), limit: Number(limit) });
        } catch (err) {
            next(err);
        }
    }

    async getPost(req, res, next) {
        try {
            const { post_id } = req.params;
            const isAdmin = req.user?.role === 'admin';
            const currentUserId = req.user?.id || null;

            const post = await PostService.getPostById(Number(post_id), {
                currentUserId,
                isAdmin,
            });

            const body = (typeof post.toJSON === 'function') ? post.toJSON() : post;
            res.json({ ...body, isFavorite: !!post.isFavorite });
        } catch (err) {
            next(err);
        }
    }

    async createPost(req, res, next) {
        try {
            const { title, content, categories = [] } = req.body;
            const post = await PostService.createPost({
                title,
                content,
                categories,
                authorId: req.user.id, // req.user из authMiddleware
            });
            res.status(201).json(post.toJSON());
        } catch (err) {
            next(err);
        }
    }

    async updatePost(req, res, next) {
        try {
            const postId = Number(req.params.post_id);
            const categories =
                Array.isArray(req.body?.categories)
                    ? req.body.categories.map(n => Number(n)).filter(Number.isFinite)
                    : undefined;

            const result = await PostService.updatePost(postId, req.user, {
                title: req.body.title,
                content: req.body.content,
                categories,
                status: req.body.status,
            });
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }

    async deletePost(req, res, next) {
        try {
            const { post_id } = req.params;
            await PostService.deletePost(post_id, req.user.id);
            res.json({ message: 'Post deleted successfully' });
        } catch (err) {
            res.status(err.status || 500).json({ message: err.message || 'Internal error' });
        }
    }

    async getCategories(req, res, next) {
        try {
            const { post_id } = req.params;
            const categories = await PostService.getCategories(post_id);
            res.json(categories);
        } catch (err) {
            next(err);
        }
    }

    async lock(req, res, next) {
        try {
            const post = await PostService.lockPost(+req.params.post_id, req.user);
            res.json(post);
        } catch (err) {
            next(err);
        }
    }

    async unlock(req, res, next) {
        try {
            const post = await PostService.unlockPost(+req.params.post_id, req.user);
            res.json(post);
        } catch (err) {
            next(err);
        }
    }
}

export default new PostController();
