const bcrypt = require('bcrypt');
const path = require('path');
const User = require('../models/User');
const UserRepository = require('../repositories/UserRepository');
const { AVATARS_DIR } = require('../middlewares/uploadMiddleware');
const { safeUnlink } = require('../utils/file');

class UserService {
    async register({ login, password, fullName, email, role = 'user' }) {
        const existingUser = await UserRepository.findByLogin(login);
        if (existingUser) throw new Error('Login already exists');

        const hashedPassword = await bcrypt.hash(password, 10);

        return await UserRepository.create({
            login,
            passwordHash: hashedPassword,
            fullName,
            email,
            role,
        });
    }

    async validatePassword(user, password) {
        return bcrypt.compare(password, user.passwordHash);
    }

    async getProfile(id) {
        return await UserRepository.findById(id);
    }

    async findByLogin(login) {
        return await UserRepository.findByLogin(login);
    }

    async findById(id) {
        return await UserRepository.findById(id);
    }

    async getAll() {
        return await UserRepository.findAll();
    }

    async update(id, data) {
        return await UserRepository.update(id, data);
    }

    async delete(id) {
        return await UserRepository.delete(id);
    }

    async updateAvatar(userId, avatar) {
        // avatar може бути рядком (path) або об’єктом (req.file)
        let newName;

        if (typeof avatar === 'string') {
            // прийшов шлях типу 'uploads/avatars/2_...png'
            newName = path.basename(avatar);
        } else if (avatar && typeof avatar === 'object') {
            // прийшов об’єкт multer'а
            const filePath = avatar.filename || avatar.path;
            if (!filePath) {
                const e = new Error('No file path provided');
                e.status = 400;
                throw e;
            }
            newName = path.basename(filePath);
        } else {
            const e = new Error('No file provided');
            e.status = 400;
            throw e;
        }

        const userRow = await UserRepository.findById(userId);
        if (!userRow) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        const old = userRow.profile_picture;
        await UserRepository.update(userId, { profile_picture: newName });
        if (old) await safeUnlink(AVATARS_DIR, old);

        const freshRow = await UserRepository.findById(userId);
        return new User(freshRow);

    }

    async removeAvatar(userId) {
        const userRow = await UserRepository.findById(userId);
        if (!userRow) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        const old = userRow.profile_picture;
        if (old) await safeUnlink(AVATARS_DIR, old);

        await UserRepository.update(userId, { profile_picture: null });

        const freshRow = await UserRepository.findById(userId);
        return new User(freshRow);
    }

    async findByEmail(email) {
        return await UserRepository.findByEmail(email);
    }

    async setEmailVerified(userId) {
        await UserRepository.setEmailVerified(userId);
    }

    async updatePassword(userId, newPassword) {
        const hashed = await bcrypt.hash(newPassword, 10);
        await UserRepository.updatePassword(userId, hashed);
    }
}

module.exports = new UserService();
