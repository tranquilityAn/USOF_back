import PostService from '../services/PostService.js';

class PostController {
    async getAllPosts(req, res, next) {
        try {
            console.log('Q:', req.query);
            const {
                page = 1,
                limit = 10,
                sort = 'date',        // 'date' | 'likes'
                order = 'desc',       // 'asc' | 'desc'
                categories,           // '1,2,3' або масив
                dateFrom,             // '2025-09-01'
                dateTo,               // '2025-09-24'
                status,               // 'active' | 'inactive' | 'all' 
            } = req.query;

            const isAdmin = req.user?.role === 'admin';
            const currentUserId = req.user?.id || null;

            let categoryIds = [];
            if (Array.isArray(categories)) {
                categoryIds = categories.map(Number).filter(Boolean);
            } else if (typeof categories === 'string') {
                categoryIds = categories.split(',').map(Number).filter(Boolean);
            }

            const result = await PostService.getAllPosts({
                page: Number(page),
                limit: Number(limit),
                isAdmin,
                currentUserId,
                sortBy: sort,
                sortOrder: order,
                filters: {
                    categoryIds,
                    dateFrom: dateFrom || null,
                    dateTo: dateTo || null,
                    status: status || null,
                },
            });

            res.json({
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                items: result.items.map(p => {
                    const base = (typeof p.toJSON === 'function') ? p.toJSON() : p;
                    return { ...base, isFavorite: !!p.isFavorite, likesCount: p.likesCount ?? 0 };
                }),
            });
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
            const result = await PostService.updatePost(postId, req.user, {
                title: req.body.title,
                content: req.body.content,
                categories: req.body.categoryIds, // очікуємо масив чисел
                status: req.body.status
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
