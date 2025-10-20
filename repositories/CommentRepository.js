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
        const whereStatusSelf = onlyActive ? "AND c.status = 'active'" : "";
        const whereStatusChildren = onlyActive ? "AND r.status = 'active'" : "";

        const [rows] = await pool.query(
            `
            SELECT
                c.*,
                COALESCE(rc.reply_count, 0) AS reply_count
            FROM comments c
            LEFT JOIN (
                SELECT parent_id, COUNT(*) AS reply_count
                FROM comments r
                WHERE r.post_id = ? ${whereStatusChildren}
                GROUP BY parent_id
            ) rc ON rc.parent_id = c.id
            WHERE c.post_id = ? AND c.parent_id IS NULL ${whereStatusSelf}
            ORDER BY c.locked DESC, c.publish_date ASC, c.id ASC
            LIMIT ? OFFSET ?
            `,
            [postId, postId, limit, offset]
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
        const whereStatusSelf = onlyActive ? "AND c.status = 'active'" : "";
        const whereStatusChildren = onlyActive ? "AND r.status = 'active'" : "";

        const [rows] = await pool.query(
            `
            SELECT
                c.*,
                COALESCE(rc.reply_count, 0) AS reply_count
            FROM comments c
            LEFT JOIN (
                SELECT parent_id, COUNT(*) AS reply_count
                FROM comments r
                WHERE r.post_id = ? ${whereStatusChildren}
                GROUP BY parent_id
            ) rc ON rc.parent_id = c.id
            WHERE c.post_id = ? AND c.parent_id = ? ${whereStatusSelf}
            ORDER BY c.publish_date ASC, c.id ASC
            LIMIT ? OFFSET ?
            `,
            [postId, postId, parentId, limit, offset]
        );

        return rows.map(r => this.#mapComment(r, { withReplyCount: true }));
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
            status: row.status,
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