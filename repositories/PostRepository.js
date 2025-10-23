import pool from '../db/connection.js';
import Post from '../models/Post.js';

class PostRepository {
    async findAll({
        limit = 10,
        offset = 0,
        onlyActive = false,
        sortBy = 'date',     // 'date' | 'likes'
        sortOrder = 'desc',  // 'asc' | 'desc'
        filters = {}
    }) {
        const { categoryIds = [], dateFrom = null, dateTo = null, status = null, authorId = null } = filters;

        const params = [];
        const where = [];
        let joins = '';

        // active / inactive
        if (onlyActive) {
            where.push("p.status = 'active'");
        } else if (status && status !== 'all') {
            where.push('p.status = ?');
            params.push(status);
        }

        // date filter
        if (dateFrom) { where.push('p.publish_date >= ?'); params.push(dateFrom); }
        if (dateTo) { where.push('p.publish_date <= ?'); params.push(dateTo); }
        if (authorId) { where.push('p.author_id = ?'); params.push(Number(authorId)); }

        // categories filter
        if (categoryIds.length) {
            const inPlaceholders = categoryIds.map(() => '?').join(',');
            where.push(`
      EXISTS (
        SELECT 1
        FROM post_categories pc
        WHERE pc.post_id = p.id AND pc.category_id IN (${inPlaceholders})
      )
    `);
            params.push(...categoryIds);
        }

        joins += `
            LEFT JOIN (
            SELECT
                entity_id AS post_id,
                SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END) AS likes_count
            FROM likes
            WHERE entity_type = 'post'
            GROUP BY entity_id
            ) lc ON lc.post_id = p.id
        `;

        joins += `
            LEFT JOIN (
                SELECT
                    post_id,
                    COUNT(*) AS comments_count
                FROM comments
                GROUP BY post_id
            ) cc ON cc.post_id = p.id
        `;

        const orderDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const orderParts = [];
        
        if (filters.authorId) {
            orderParts.push('p.locked_by_author DESC');
        }

        if (sortBy === 'likes') {
            orderParts.push(`COALESCE(lc.likes_count, 0) ${orderDir}`);
        }

        orderParts.push(`p.publish_date ${orderDir}`, `p.id ${orderDir}`);
        const orderSql = ' ORDER BY ' + orderParts.join(', ');

        const whereSql = where.length ? ` WHERE ${where.join(' AND ')} ` : '';

        const sql = `
    SELECT
      p.id,
      p.title,
      p.content,
      p.author_id        AS authorId,
      p.publish_date     AS publishDate,
      p.status,
      p.locked_by_author AS lockedByAuthor,
      COALESCE(lc.likes_count, 0)   AS likesCount,
      COALESCE(cc.comments_count, 0) AS commentsCount
    FROM posts p
    ${joins}
    ${whereSql}
    ${orderSql}
    LIMIT ? OFFSET ?
  `;

        const countSql = `
    SELECT COUNT(*) AS cnt
    FROM posts p
    ${categoryIds.length ? `
      WHERE ${where.filter(w => !w.includes('EXISTS')).join(' AND ') || '1=1'}
      ${where.some(w => w.includes('EXISTS')) ? `
        AND EXISTS (
          SELECT 1 FROM post_categories pc
          WHERE pc.post_id = p.id AND pc.category_id IN (${categoryIds.map(() => '?').join(',')})
        )
      ` : ''}
    ` : (where.length ? ` WHERE ${where.join(' AND ')}` : '')}
  `;

        const paramsWithLimit = params.concat([Number(limit), Number(offset)]);
        const [rows] = await pool.query(sql, paramsWithLimit);
        const [countRows] = await pool.query(countSql, categoryIds.length ? params.filter(x => !Array.isArray(x)).concat(categoryIds) : params);

        return rows.map(r => new Post(r));
    }

    async countAll({ onlyActive = false, filters = {} }) {
        const { categoryIds = [], dateFrom = null, dateTo = null, status = null, authorId = null } = filters;

        const params = [];
        const where = [];

        if (onlyActive) {
            where.push("p.status = 'active'");
        } else if (status && status !== 'all') {
            where.push('p.status = ?');
            params.push(status);
        }
        if (dateFrom) { where.push('p.publish_date >= ?'); params.push(dateFrom); }
        if (dateTo) { where.push('p.publish_date <= ?'); params.push(dateTo); }
        if (authorId) { where.push('p.author_id = ?'); params.push(Number(authorId)); }

        let whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';

        if (categoryIds.length) {
            const inPh = categoryIds.map(() => '?').join(',');
            whereSql = `${whereSql ? whereSql + ' AND ' : ' WHERE '} EXISTS (
      SELECT 1 FROM post_categories pc
      WHERE pc.post_id = p.id AND pc.category_id IN (${inPh})
    )`;
            params.push(...categoryIds);
        }

        const countSql = `SELECT COUNT(*) AS cnt FROM posts p ${whereSql}`;
        const [rows] = await pool.query(countSql, params);
        return rows?.[0]?.cnt || 0;
    }

    async findById(id) {
        const sql = `
      SELECT
        p.id,
        p.title,
        p.content,
        p.author_id        AS authorId,
        p.publish_date     AS publishDate,
        p.status,
        p.locked_by_author AS lockedByAuthor,
        COALESCE(lc.likes_count, 0)    AS likesCount,
        COALESCE(cc.comments_count, 0) AS commentsCount
      FROM posts p
      LEFT JOIN (
        SELECT
          entity_id AS post_id,
          SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END) AS likes_count
        FROM likes
        WHERE entity_type = 'post'
        GROUP BY entity_id
      ) lc ON lc.post_id = p.id
      LEFT JOIN (
        SELECT
          post_id,
          COUNT(*) AS comments_count
        FROM comments
        GROUP BY post_id
      ) cc ON cc.post_id = p.id
      WHERE p.id = ?
    `;
        const [rows] = await pool.query(sql, [id]);
        return rows[0] ? new Post(rows[0]) : null;
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

    #mapPost(row, { includeLikes = false, includeComments = false } = {}) {
        return new Post({
            id: row.id,
            title: row.title,
            content: row.content,
            authorId: row.author_id,
            publishDate: row.publish_date,
            status: row.status,
            lockedByAuthor: row.locked_by_author,
            likesCount: includeLikes ? (row.likesCount ?? 0) : undefined,
            commentsCount: includeComments ? (row.commentsCount ?? 0) : undefined,
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
