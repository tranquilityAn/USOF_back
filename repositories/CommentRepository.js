import pool from '../db/connection.js';
import Comment from '../models/Comment.js';

class CommentRepository {
    async findByPost(postId, { onlyActive = false } = {}) {
        const where = onlyActive ? "AND status = 'active'" : "";
        const [rows] = await pool.query(`SELECT * FROM comments WHERE post_id = ? ${where} ORDER BY locked DESC, publish_date ASC`, [postId]);
        return rows.map(r => this.#mapComment(r));
    }

    async findById(id) {
        const [rows] = await pool.query("SELECT * FROM comments WHERE id = ?", [id]);
        return rows[0] ? this.#mapComment(rows[0]) : null;
    }

    async create({ postId, authorId, content }) {
        const [result] = await pool.query(
            "INSERT INTO comments (post_id, author_id, content, publish_date) VALUES (?, ?, ?, NOW())",
            [postId, authorId, content]
        );
        return new Comment({ id: result.insertId, postId, authorId, content });
    }

    async updateStatus(id, status) {
        await pool.query('UPDATE comments SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
        return this.findById(id);
    }

    async delete(id) {
        await pool.query("DELETE FROM comments WHERE id = ?", [id]);
    }

    async findByIdPublic(id, { allowInactive = false } = {}) {
        const [rows] = await pool.query("SELECT * FROM comments WHERE id = ?", [id]);
        if (!rows[0]) return null;
        const c = this.#mapComment(rows[0]);
        if (!allowInactive && c.status && c.status !== 'active') return null;
        return c;
    }

    async update(id, fields) {
        const keys = Object.keys(fields).filter(k => fields[k] !== undefined);
        if (keys.length === 0) return this.findById(id);

        const setSql = keys.map(k => `${this.#toDbCol(k)} = ?`).join(", ");
        const values = keys.map(k => fields[k]); values.push(id);

        await pool.query(`UPDATE comments SET ${setSql}, updated_at = NOW() WHERE id = ?`, values);
        return this.findById(id);
    }

    #mapComment(row) {
        return new Comment({
            id: row.id,
            postId: row.post_id,
            authorId: row.author_id,
            content: row.content,
            publishDate: row.publish_date,
            //updatedAt: row.updated_at,
            locked: row.locked === 1 || row.locked === true,
        });
    }

    #toDbCol(field) {
        const map = {
            content: "content",
            status: "status",
            locked: "locked", // <-- додати
        };
        return map[field] || field;
    }
}

export default new CommentRepository