const FavoriteService = require("../services/FavoriteService");

class FavoriteController {
    async listMyFavorites(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const userId = req.user.id;
            const result = await FavoriteService.listMyFavorites(userId, {
                page: Number(page),
                limit: Number(limit)
            });
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async add(req, res, next) {
        try {
            const userId = req.user.id;
            const postId = Number(req.params.post_id);
            const out = await FavoriteService.addToFavorites(userId, postId);
            res.status(201).json(out);
        } catch (err) {
            next(err);
        }
    }

    async remove(req, res, next) {
        try {
            const userId = req.user.id;
            const postId = Number(req.params.post_id);
            const out = await FavoriteService.removeFromFavorites(userId, postId);
            res.json(out);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new FavoriteController();
