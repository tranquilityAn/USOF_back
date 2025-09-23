const pool = require("../db/connection");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

class PostRepository {
    // --- POSTS ---
    async findAll({ limit = 10, offset = 0 , onlyActive = false}) {
        const where = onlyActive ? "WHERE status = 'active'" : "";
        const [rows] = await pool.query(
            `SELECT * FROM posts ${where} ORDER BY publish_date DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        return rows.map(r => this.#mapPost(r));
    }

    async countAll({ onlyActive = false }) {
        const where = onlyActive ? "WHERE status = 'active'" : "";
        const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM posts ${where}`);
        return rows[0]?.cnt || 0;
    }

    async findById(id) {
        const [rows] = await pool.query("SELECT * FROM posts WHERE id = ?", [id]);
        return rows[0] ? this.#mapPost(rows[0]) : null;
    }

    async create({ title, content, authorId }) {
        const [result] = await pool.query(
            "INSERT INTO posts (title, content, author_id, publish_date) VALUES (?, ?, ?, NOW())",
            [title, content, authorId]
        );
        return new Post({ id: result.insertId, title, content, authorId });
    }

    async delete(id) {
        await pool.query("DELETE FROM posts WHERE id = ?", [id]);
    }

    async addCategories(postId, categoryIds) {
        if (categoryIds.length === 0) {
            return;
        }

        const values = categoryIds.map(categoryId => [postId, categoryId]);
        await pool.query(
            "INSERT INTO post_categories (post_id, category_id) VALUES ?",
            [values]
        );
    }

    async findCategories(postId) {
        const [rows] = await pool.query(
            `SELECT c.* FROM categories c
         JOIN post_categories pc ON c.id = pc.category_id
         WHERE pc.post_id = ?`,
            [postId]
        );
        return rows;
    }

    async update(id, fields) {
        const keys = Object.keys(fields).filter(k => fields[k] !== undefined);
        if (keys.length === 0) return this.findById(id);

        const setSql = keys.map(k => `${this.#toDbCol(k)} = ?`).join(", ");
        const values = keys.map(k => fields[k]);
        values.push(id);

        await pool.query(`UPDATE posts SET ${setSql}, updated_at = NOW() WHERE id = ?`, values);
        return this.findById(id);
    }

    async replaceCategories(postId, categoryIds) {
        await pool.query('DELETE FROM post_categories WHERE post_id = ?', [postId]);
        if (!Array.isArray(categoryIds) || categoryIds.length === 0) return;

        const values = categoryIds.map(cid => [postId, cid]);
        await pool.query('INSERT INTO post_categories (post_id, category_id) VALUES ?', [values]);
    }

    async validateCategoryIds(categoryIds) {
        if (!Array.isArray(categoryIds) || categoryIds.length === 0) return true;
        const placeholders = categoryIds.map(() => '?').join(',');
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS cnt FROM categories WHERE id IN (${placeholders})`,
            categoryIds
        );
        return rows[0]?.cnt === categoryIds.length;
    }

    // --- PRIVATE HELPERS ---
    #mapPost(row) {
        return new Post({
            id: row.id,
            title: row.title,
            content: row.content,
            authorId: row.author_id,
            createdAt: row.publish_date,
            //updatedAt: row.updated_at,
            likesCount: row.likes_count || 0,
        });
    }

    #toDbCol(field) {
        const map = {
            title: "title",
            content: "content",
            status: "status",
        };
        return map[field] || field;
    }
}

module.exports = new PostRepository();
