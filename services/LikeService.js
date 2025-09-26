import likeRepo from '../repositories/LikeRepository.js';

const ALLOWED_ENTITY_TYPES = ['post', 'comment'];
const ALLOWED_REACTION_TYPES = ['like', 'dislike'];

class LikeService {
    #assertEntityType(entityType) {
        if (!ALLOWED_ENTITY_TYPES.includes(entityType)) {
            const err = new Error('Invalid entity type');
            err.status = 400;
            throw err;
        }
    }

    #assertReactionType(type) {
        if (type && !ALLOWED_REACTION_TYPES.includes(type)) {
            const err = new Error('Invalid reaction type');
            err.status = 400;
            throw err;
        }
    }

    async getLikes(entityType, entityId) {
        this.#assertEntityType(entityType);
        return likeRepo.findByEntity(entityType, entityId);
    }

    /**
     * Правила:
     * - уникальный ключ (author_id, entity_id, entity_type) позволяет иметь ровно 1 запись на пользователя и сущность
     * - если запись уже есть и тип совпадает — кидаем ошибку 'Already liked'
     * - если запись есть, но тип другой — переключаем тип (update)
     * - если записи нет — создаём
     */
    async addLike(entityType, entityId, userId, type = 'like') {
        this.#assertEntityType(entityType);
        this.#assertReactionType(type);

        const existing = await likeRepo.findByUserAndEntity(userId, entityType, entityId);
        if (existing) {
            if (existing.type === type) {
                const err = new Error('Already liked');
                err.status = 409;
                throw err;
            }
            await likeRepo.updateType(existing.id, type);
            return { switched: true, to: type };
        }

        return likeRepo.create({ userId, entityType, entityId, type });
    }

    async removeLike(entityType, entityId, userId) {
        this.#assertEntityType(entityType);
        const existing = await likeRepo.findByUserAndEntity(userId, entityType, entityId);
        if (!existing) {
            const err = new Error('Like not found');
            err.status = 404;
            throw err;
        }
        await likeRepo.delete(existing.id);
        return true;
    }
}

export default new LikeService();