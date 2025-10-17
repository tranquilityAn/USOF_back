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

    async findTopLevelByPost(postId, { limit = 20, offset = 0, onlyActive = false } = {}) {
        const whereStatus = onlyActive ? "AND c.status = 'active'" : "";
        const [rows] = await pool.query(
            `
      SELECT
        c.*,
        (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id AND r.post_id = c.post_id ${onlyActive ? "AND r.status = 'active'" : ""}) AS reply_count
      FROM comments c
      WHERE c.post_id = ? AND c.parent_id IS NULL ${whereStatus}
      ORDER BY c.publish_date ASC, c.id ASC
      LIMIT ? OFFSET ?
      `,
            [postId, limit, offset]
        );
        return rows.map(r => this.#mapComment(r, { withReplyCount: true }));
    }

    async countTopLevelByPost(postId, { onlyActive = false } = {}) {
        const whereStatus = onlyActive ? "AND status = 'active'" : "";
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS cnt FROM comments WHERE post_id = ? AND parent_id IS NULL ${whereStatus}`,
            [postId]
        );
        return rows[0]?.cnt ?? 0;
    }

    async findReplies(postId, parentId, { limit = 20, offset = 0, onlyActive = false } = {}) {
        const whereStatus = onlyActive ? "AND status = 'active'" : "";
        const [rows] = await pool.query(
            `
      SELECT * FROM comments
      WHERE post_id = ? AND parent_id = ? ${whereStatus}
      ORDER BY publish_date ASC, id ASC
      LIMIT ? OFFSET ?
      `,
            [postId, parentId, limit, offset]
        );
        return rows.map(r => this.#mapComment(r));
    }

    async countReplies(postId, parentId, { onlyActive = false } = {}) {
        const whereStatus = onlyActive ? "AND status = 'active'" : "";
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS cnt FROM comments WHERE post_id = ? AND parent_id = ? ${whereStatus}`,
            [postId, parentId]
        );
        return rows[0]?.cnt ?? 0;
    }

    async create({ postId, authorId, content, parentId = null }) {
        const [result] = await pool.query(
            "INSERT INTO comments (post_id, author_id, content, parent_id, publish_date) VALUES (?, ?, ?, ?, NOW())",
            [postId, authorId, content, parentId]
        );
        return this.findById(result.insertId);
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

    #mapComment(row, { withReplyCount = false } = {}) {
        return new Comment({
            id: row.id,
            postId: row.post_id,
            authorId: row.author_id,
            content: row.content,
            publishDate: row.publish_date,
            locked: row.locked === 1 || row.locked === true || row.locked === '1',
            parentId: row.parent_id ?? null,
            replyCount: withReplyCount ? (row.reply_count ?? 0) : undefined,
        });
    }

    #toDbCol(field) {
        const map = {
            content: "content",
            status: "status",
            locked: "locked",
        };
        return map[field] || field;
    }
}

export default new CommentRepository;