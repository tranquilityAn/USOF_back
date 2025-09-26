import pool from '../db/connection.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

class PostRepository {
    async findAll({ limit = 10, offset = 0, onlyActive = false, sortBy = 'date', sortOrder = 'desc', filters = {} }) {
        console.log('R:', { onlyActive, sortBy, sortOrder, filters });
        const { categoryIds = [], dateFrom = null, dateTo = null, status = null } = filters;

        const params = [];
        const where = [];
        let joins = '';

        if (onlyActive) {
            where.push("p.status = 'active'");
        } else if (status && status !== 'all') {
            where.push("p.status = ?");
            params.push(status);
        }

        if (dateFrom) { where.push("p.publish_date >= ?"); params.push(dateFrom); }
        if (dateTo) { where.push("p.publish_date <= ?"); params.push(dateTo); }

        if (Array.isArray(categoryIds) && categoryIds.length) {
            joins += " JOIN post_categories pc ON pc.post_id = p.id ";
            where.push(`pc.category_id IN (${categoryIds.map(() => '?').join(',')})`);
            params.push(...categoryIds);
        }

        joins += `
            LEFT JOIN (
            SELECT entity_id AS post_id,
                    SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END) AS likes_count
            FROM likes
            WHERE entity_type = 'post'
            GROUP BY entity_id
            ) l ON l.post_id = p.id
        `;

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        console.log('WHERE:', whereSql, params);

        // ORDER BY
        const dir = (String(sortOrder).toLowerCase() === 'asc') ? 'ASC' : 'DESC';
        let orderBy;
        if (String(sortBy).toLowerCase() === 'likes') {
            orderBy = `ORDER BY p.locked_by_author DESC, COALESCE(l.likes_count, 0) ${dir}, p.publish_date DESC`;
        } else { // 'date' за замовчуванням
            orderBy = `ORDER BY p.locked_by_author DESC, p.publish_date ${dir}`;
        }
        console.log('ORDER BY:', orderBy);

        const sql = `
            SELECT p.*, COALESCE(l.likes_count, 0) AS likesCount
            FROM posts p
            ${joins}
            ${whereSql}
            GROUP BY p.id
            ${orderBy}
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.query(sql, [...params, limit, offset]);
        return rows.map(r => this.#mapPost(r, { includeLikes: true }));
    }

    async countAll({ onlyActive = false, filters = {} }) {
        const { categoryIds = [], dateFrom = null, dateTo = null, status = null } = filters;

        const params = [];
        const where = [];
        let joins = '';

        if (onlyActive) {
            where.push("p.status = 'active'");
        } else if (status && status !== 'all') {
            where.push("p.status = ?");
            params.push(status);
        }

        if (dateFrom) { where.push("p.publish_date >= ?"); params.push(dateFrom); }
        if (dateTo) { where.push("p.publish_date <= ?"); params.push(dateTo); }

        if (Array.isArray(categoryIds) && categoryIds.length) {
            joins += " JOIN post_categories pc ON pc.post_id = p.id ";
            where.push(`pc.category_id IN (${categoryIds.map(() => '?').join(',')})`);
            params.push(...categoryIds);
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const sql = `
            SELECT COUNT(DISTINCT p.id) AS cnt
            FROM posts p
            ${joins}
            ${whereSql}
        `;
        const [rows] = await pool.query(sql, params);
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

    #mapPost(row, { includeLikes = false } = {}) {
        return new Post({
            id: row.id,
            title: row.title,
            content: row.content,
            authorId: row.author_id,
            publishDate: row.publish_date,
            status: row.status,
            lockedByAuthor: row.locked_by_author,
            likesCount: includeLikes ? (row.likesCount ?? 0) : undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }

    #toDbCol(field) {
        const map = {
            title: "title",
            content: "content",
            status: "status",
            lockedByAuthor: "locked_by_author",
        };
        return map[field] || field;
    }
}

export default new PostRepository();