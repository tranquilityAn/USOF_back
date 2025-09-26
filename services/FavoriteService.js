import favoriteRepo from '../repositories/FavoriteRepository.js';
import postRepo from '../repositories/PostRepository.js';

class FavoriteService {
    async addToFavorites(userId, postId) {
        const post = await postRepo.findById(postId);
        if (!post) {
            const e = new Error("Post not found");
            e.status = 404;
            throw e;
        }

        const already = await favoriteRepo.exists(userId, postId);
        if (already) {
            const e = new Error("Already in favorites");
            e.status = 409;
            throw e;
        }

        await favoriteRepo.add(userId, postId);
        return { message: "Added to favorites" };
    }

    async removeFromFavorites(userId, postId) {
        const exists = await favoriteRepo.exists(userId, postId);
        if (!exists) {
            const e = new Error("Not in favorites");
            e.status = 404;
            throw e;
        }
        await favoriteRepo.remove(userId, postId);
        return { message: "Removed from favorites" };
    }

    async listMyFavorites(userId, { page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;

        const [rows, total] = await Promise.all([
            favoriteRepo.listByUser(userId, { limit, offset }),
            favoriteRepo.countByUser(userId)
        ]);

        const items = rows.map(r => ({
            id: r.id,
            title: r.title,
            content: r.content,
            authorId: r.author_id,
            publishDate: r.publish_date,
            status: r.status
        }));

        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
            items
        };
    }
}

export default new FavoriteService();