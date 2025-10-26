import LikeService from '../services/LikeService.js';

class LikeController {
    #resolveEntity(req) {
        const entityType = req.entityType || (req.params.post_id ? 'post' : req.params.comment_id ? 'comment' : undefined);
        const entityId = req.entityId || Number(req.params.post_id || req.params.comment_id);
        return { entityType, entityId };
    }

    async getLikes(req, res, next) {
        try {
            const { entityType, entityId } = this.#resolveEntity(req);
            const likes = await LikeService.getLikes(entityType, entityId);
            res.json(likes.map((l) => l.toJSON()));
        } catch (err) {
            next(err);
        }
    }

    async addLike(req, res, next) {
        try {
            const { entityType, entityId } = this.#resolveEntity(req);
            const userId = req.user.id;
            const type = req.body?.type || 'like';
            const result = await LikeService.addLike(entityType, entityId, userId, type);

            if (result?.switched) {
                return res.status(200).json({ message: `Reaction switched to ${result.to}` });
            }
            return res.status(201).json({ message: `${type} saved successfully` });
        } catch (err) {
            next(err);
        }
    }

    async removeLike(req, res, next) {
        try {
            const { entityType, entityId } = this.#resolveEntity(req);
            const userId = req.user.id;
            await LikeService.removeLike(entityType, entityId, userId);
            res.json({ message: 'Reaction removed successfully' });
        } catch (err) {
            next(err);
        }
    }
}

export default new LikeController();