const bcrypt = require("bcrypt");
const User = require("../models/User");
const UserRepository = require("../repositories/UserRepository");

class UserService {
    async register({ login, password, fullName, email, role = "user" }) {
        const existingUser = await UserRepository.findByLogin(login);
        if (existingUser) throw new Error("Login already exists");

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

    async updateAvatar(id, avatarPath) {
        return await UserRepository.update(id, { profile_picture: avatarPath });
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
