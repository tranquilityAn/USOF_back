const PostService = require("../services/PostService");

class PostController {
    async getAllPosts(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const isAdmin = req.user?.role === 'admin';
            const result = await PostService.getAllPosts({ page: Number(page), limit: Number(limit), isAdmin });
            //const posts = await PostService.getAllPosts({ page: Number(page), limit: Number(limit) });
            res.json({
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                items: result.items.map(p => p.toJSON())
            });
            //res.json(posts.map(p => p.toJSON()));
        } catch (err) {
            next(err);
        }
    }

    async getPost(req, res, next) {
        try {
            const { post_id } = req.params;
            const post = await PostService.getPostById(post_id);
            res.json(post);
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
        catch(err) {
            next(err);
        }
    }

    async deletePost(req, res, next) {
        try {
            const { post_id } = req.params;
            await PostService.deletePost(post_id, req.user.id);
            res.json({ message: "Post deleted successfully" });
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
}

module.exports = new PostController();

