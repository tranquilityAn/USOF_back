const pool = require("../db/connection");
const User = require("../models/User");

class UserRepository {
    async findAll() {
        const [rows] = await pool.query("SELECT * FROM users");
        return rows.map(row => new User(this.#mapRow(row)));
    }

    async findById(id) {
        const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
        return rows[0] ? new User(this.#mapRow(rows[0])) : null;
    }

    async findByLogin(login) {
        const [rows] = await pool.query("SELECT * FROM users WHERE login = ?", [login]);
        return rows[0] ? new User(this.#mapRow(rows[0])) : null;
    }

    async findByEmail(email) {
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        return rows[0] ? new User(this.#mapRow(rows[0])) : null;
    }

    async create(userData) {
        const { login, passwordHash, fullName, email, role = "user" } = userData;
        const [result] = await pool.query(
            "INSERT INTO users (login, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)",
            [login, passwordHash, fullName, email, role]
        );
        return this.findById(result.insertId);
    }

    async update(id, fields) {
        if (!fields || typeof fields !== 'object') {
            return this.findById(id);
        }

        const keys = Object.keys(fields);
        if (keys.length === 0) return await this.findById(id);

        const setSql = keys.map(k => `${this.#toDbCol(k)} = ?`).join(", ");
        const values = keys.map(k => fields[k]);
        values.push(id);

        await pool.query(`UPDATE users SET ${setSql}, updated_at = NOW() WHERE id = ?`, values);

        return this.findById(id);
    }

    async delete(id) {
        await pool.query("DELETE FROM users WHERE id = ?", [id]);
    }

    async setEmailVerified(userId) {
        await pool.query("UPDATE users SET email_verified = 1 WHERE id = ?", [userId]);
    }

    async updatePassword(userId, passwordHash) {
        await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
    }

    #mapRow(row) {
        return {
            id: row.id,
            login: row.login,
            passwordHash: row.password_hash,
            fullName: row.full_name,
            email: row.email,
            emailVerified: !!row.email_verified,
            profilePicture: row.profile_picture,
            rating: row.rating,
            role: row.role,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    #toDbCol(field) {
        const map = {
            login: "login",
            passwordHash: "password_hash",
            fullName: "full_name",
            email: "email",
            emailVerified: "email_verified",
            profilePicture: "profile_picture",
            rating: "rating",
            role: "role",
        };
        return map[field] || field;
    }
}

module.exports = new UserRepository();
