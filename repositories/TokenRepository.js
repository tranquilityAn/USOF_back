import pool from '../db/connection.js';

class TokenRepository {
    async create({ tokenHash, userId, type, meta = null, expiresAt }) {
        const [r] = await pool.query(
            `INSERT INTO user_tokens (token, user_id, type, meta, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
            [tokenHash, userId, type, meta ? JSON.stringify(meta) : null, expiresAt]
        );
        return r.insertId;
    }

    async findActiveByHash(tokenHash) {
        const [rows] = await pool.query(
            `SELECT * FROM user_tokens 
       WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1`,
            [tokenHash]
        );
        return rows[0] || null;
    }

    async markUsed(tokenHash) {
        await pool.query(`UPDATE user_tokens SET used = 1 WHERE token = ?`, [tokenHash]);
    }

    async invalidateOld(userId, type) {
        await pool.query(
            `UPDATE user_tokens SET used = 1 WHERE user_id = ? AND type = ? AND used = 0`,
            [userId, type]
        );
    }

    async findLastByUserAndType(userId, type) {
        const [rows] = await pool.query(
            `SELECT created_at FROM user_tokens
                WHERE user_id = ? AND type = ?
                ORDER BY created_at DESC
                LIMIT 1`,
            [userId, type]
        );
        return rows[0] || null;
    }
}

export default new TokenRepository();