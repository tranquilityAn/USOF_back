const postRepo = require('../repositories/PostRepository');
const commentService = require('./CommentService');
const categoryService = require('./CategoryService');
const likeService = require('./LikeService');
const favoriteRepo = require('../repositories/FavoriteRepository');

class PostService {
    async getAllPosts({ page = 1, limit = 10, isAdmin = false, currentUserId = null, sortBy = 'date', sortOrder = 'desc', filters = {} }) {
        console.log('S:', { sortBy, sortOrder, filters });
        const offset = (page - 1) * limit;

        const effectiveFilters = { ...filters };
        const onlyActive = !isAdmin;

        const [items, total] = await Promise.all([
            postRepo.findAll({ limit, offset, onlyActive, sortBy, sortOrder, filters: effectiveFilters }),
            postRepo.countAll({ onlyActive, filters: effectiveFilters }),
        ]);

        if (currentUserId && items.length) {
            const favoriteMap = await require('../repositories/FavoriteRepository').existsForMany(
                currentUserId,
                items.map(p => p.id)
            );
            items.forEach(p => (p.isFavorite = !!favoriteMap[p.id]));
        } else {
            items.forEach(p => (p.isFavorite = false));
        }

        const totalPages = Math.ceil(total / limit) || 1;
        return { page, limit, total, totalPages, items };
    }

    async getPostById(postId, { currentUserId = null, isAdmin = false } = {}) {
        const post = await postRepo.findById(postId);
        if (!post) {
            const e = new Error("Post not found");
            e.status = 404;
            throw e;
        }

        // Перевірка видимості: юзер бачить active інших або свої (навіть inactive)
        if (!isAdmin) {
            const canSee = post.status === 'active' || post.authorId === currentUserId;
            if (!canSee) {
                const e = new Error("Post not available");
                e.status = 403;
                throw e;
            }
        }

        // isFavorite для конкретного поста
        post.isFavorite = currentUserId ? await favoriteRepo.exists(currentUserId, postId) : false;

        return post;
    }

    async getCategories(postId) {
        const post = await postRepo.findById(postId);
        if (!post) {
            throw new Error("Post not found");
        }
        return await categoryService.getCategoriesByPost(postId);
    }

    async createPost({ title, content, categories = [], authorId }) {
        if (!title || !content) {
            throw new Error('Title and content are required');
        }

        const post = await postRepo.create({ title, content, authorId });

        if (categories.length > 0) {
            await postRepo.addCategories(post.id, categories);
        }

        return post;
    }

    async updatePost(postId, user, { title, content, categories, status } = {}) {
        const post = await postRepo.findById(postId);
        if (!post) {
            const e = new Error('Post not found'); e.status = 404; throw e;
        }

        const isAdmin = user.role === 'admin';
        const isAuthor = post.authorId === user.id;

        // Формуємо allow-list полів за роллю
        const payload = { title, content, categories, status };
        const keys = Object.keys(payload).filter(k => payload[k] !== undefined);

        if (!keys.length) {
            // нічого оновлювати — повернемо поточний стан
            const cats = await postRepo.findCategories(postId);
            const likes = await likeService.getLikes('post', postId);
            const comments = await commentService.getCommentsByPost(postId);
            return { ...post.toJSON(), categories: cats, likesCount: likes.length, commentsCount: comments.length };
        }

        if (isAuthor && !isAdmin) {
            // Автор: можна title/content/categories; НЕ можна status
            const forbidden = keys.filter(k => !['title', 'content', 'categories'].includes(k));
            if (forbidden.length) { const e = new Error('Forbidden field(s) for author: ' + forbidden.join(', ')); e.status = 403; throw e; }
        } else if (isAdmin && !isAuthor) {
            // Адмін (не автор): можна status і categories; НЕ можна title/content
            const forbidden = keys.filter(k => !['status', 'categories'].includes(k));
            if (forbidden.length) { const e = new Error('Forbidden field(s) for admin: ' + forbidden.join(', ')); e.status = 403; throw e; }
        } else if (isAdmin && isAuthor) {
            // Якщо раптом адмін = автор — дозволимо все, окрім несумісних речей з ТЗ (контент адміном редагувати не треба, але як автор він може)
            // За замовчуванням: дозволяємо ['title','content','categories','status'].
        } else {
            const e = new Error('Forbidden: not your post'); e.status = 403; throw e;
        }

        // Валідації
        if (title !== undefined && typeof title !== 'string') { const e = new Error('title must be string'); e.status = 400; throw e; }
        if (content !== undefined && typeof content !== 'string') { const e = new Error('content must be string'); e.status = 400; throw e; }
        if (categories !== undefined && !Array.isArray(categories)) { const e = new Error('categories must be an array of ids'); e.status = 400; throw e; }
        if (status !== undefined && !['active', 'inactive'].includes(status)) { const e = new Error('status must be "active" or "inactive"'); e.status = 400; throw e; }

        // Оновлення основних полів
        if (title !== undefined || content !== undefined || status !== undefined) {
            await postRepo.update(postId, { title, content, status });
        }

        // Повна заміна категорій (за наявності)
        if (categories !== undefined) {
            if (!(await postRepo.validateCategoryIds(categories))) {
                const e = new Error('Some categories do not exist'); e.status = 400; throw e;
            }
            await postRepo.replaceCategories(postId, categories);
        }

        // Повертаємо оновлений пост з категоріями та лічильниками
        const updated = await postRepo.findById(postId);
        const cats = await postRepo.findCategories(postId);
        const likes = await likeService.getLikes('post', postId);
        const comments = await commentService.getCommentsByPost(postId);

        return {
            ...updated.toJSON(),
            categories: cats,
            likesCount: likes.length,
            commentsCount: comments.length,
        };
    }


    async deletePost(postId, userId) {
        const post = await postRepo.findById(postId);
        if (!post) throw new Error('Post not found');

        if (post.authorId !== userId) {
            throw new Error('Forbidden: not your post');
        }

        await postRepo.delete(postId);
        return true;
    }

    async lockPost(postId, currentUser) {
        const post = await postRepo.findById(postId);
        if (!post) { const e = new Error('Post not found'); e.status = 404; throw e; }

        const isOwner = post.authorId === currentUser.id;
        const isAdmin = currentUser.role === 'admin';
        if (!isOwner && !isAdmin) { const e = new Error('Forbidden'); e.status = 403; throw e; }

        await postRepo.update(postId, { lockedByAuthor: 1 });
        return await postRepo.findById(postId);
    }

    async unlockPost(postId, currentUser) {
        const post = await postRepo.findById(postId);
        if (!post) { const e = new Error('Post not found'); e.status = 404; throw e; }

        const isOwner = post.authorId === currentUser.id;
        const isAdmin = currentUser.role === 'admin';
        if (!isOwner && !isAdmin) { const e = new Error('Forbidden'); e.status = 403; throw e; }

        await postRepo.update(postId, { lockedByAuthor: 0 });
        return await postRepo.findById(postId);
    }
}

module.exports = new PostService();
