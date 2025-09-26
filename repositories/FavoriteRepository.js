import pool from '../db/connection.js';

class FavoriteRepository {
    async add(userId, postId) {
        await pool.query(
            "INSERT INTO favorites (user_id, post_id) VALUES (?, ?)",
            [userId, postId]
        );
        return new Favorite({ userId, postId });
    }

    async remove(userId, postId) {
        await pool.query(
            "DELETE FROM favorites WHERE user_id = ? AND post_id = ?",
            [userId, postId]
        );
    }

    async exists(userId, postId) {
        const [rows] = await pool.query(
            "SELECT 1 FROM favorites WHERE user_id = ? AND post_id = ? LIMIT 1",
            [userId, postId]
        );
        return rows.length > 0;
    }

    async countByUser(userId, { includeInactiveOfOthers = false } = {}) {
        // Якщо включаємо тільки видимі пости (active або власні)
        const where =
            includeInactiveOfOthers
                ? "p.status = 'active' OR p.author_id = ?"
                : "p.status = 'active' OR p.author_id = ?";
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS cnt
       FROM favorites f
       JOIN posts p ON p.id = f.post_id
       WHERE f.user_id = ? AND (${where})`,
            [userId, userId]
        );
        return rows[0]?.cnt || 0;
    }

    async listByUser(userId, { limit = 10, offset = 0 } = {}) {
        const [rows] = await pool.query(
            `SELECT p.*
       FROM favorites f
       JOIN posts p ON p.id = f.post_id
       WHERE f.user_id = ?
         AND (p.status = 'active' OR p.author_id = ?)
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
            [userId, userId, limit, offset]
        );
        return rows;
    }

    async existsForMany(userId, postIds) {
        if (!userId || !Array.isArray(postIds) || postIds.length === 0) return {};
        const placeholders = postIds.map(() => "?").join(",");
        const [rows] = await pool.query(
            `SELECT post_id FROM favorites 
       WHERE user_id = ? AND post_id IN (${placeholders})`,
            [userId, ...postIds]
        );
        const set = new Set(rows.map(r => r.post_id));
        return Object.fromEntries(postIds.map(id => [id, set.has(id)]));
    }
}

export default new FavoriteRepository();