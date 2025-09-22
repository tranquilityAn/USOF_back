const UserService = require("../services/UserService");

class UserController {
    async getAll(req, res, next) {
        try {
            const users = await UserService.getAll();
            res.json(users.map(u => u.toJSON()));
        } catch (err) {
            next(err);
        }
    }

    async getById(req, res, next) {
        try {
            const { user_id } = req.params;
            const user = await UserService.getProfile(user_id);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            res.json(user.toJSON());
        } catch (err) {
            next(err);
        }
    }

    async create(req, res, next) {
        try {
            const { login, password, email, fullName, role } = req.body;
            const user = await UserService.register({ login, password, email, fullName, role });
            res.status(201).json(user.toJSON());
        } catch (err) {
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const { user_id } = req.params;
            const data = req.body;
            const updatedUser = await UserService.update(user_id, data);
            res.json(updatedUser.toJSON());
        } catch (err) {
            next(err);
        }
    }

    async delete(req, res, next) {
        try {
            const { user_id } = req.params;
            await UserService.delete(user_id);
            res.json({ message: "User deleted" });
        } catch (err) {
            next(err);
        }
    }

    async updateAvatar(req, res, next) {
        try {
            const { file } = req; // при использовании multer
            const userId = req.user.id;
            const updatedUser = await UserService.updateAvatar(userId, file.path);
            res.json(updatedUser.toJSON());
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new UserController();
