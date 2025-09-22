const pool = require("../db/connection");
const Category = require("../models/Category");

class CategoryRepository {
    async findAll() {
        const [rows] = await pool.query("SELECT * FROM categories");
        return rows.map(r => this.#mapCategory(r));
    }

    async findById(id) {
        const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [id]);
        return rows[0] ? this.#mapCategory(rows[0]) : null;
    }

    async findPosts(categoryId) {
        const [rows] = await pool.query(
            `SELECT p.* FROM posts p
       JOIN post_categories pc ON p.id = pc.post_id
       WHERE pc.category_id = ?`,
            [categoryId]
        );
        return rows;
    }

    async create({ title, description = null }) {
        const [result] = await pool.query(
            "INSERT INTO categories (title, description) VALUES (?, ?)",
            [title, description]
        );
        return new Category({ id: result.insertId, title, description });
    }

    async update(id, fields) {
        const keys = Object.keys(fields);
        if (keys.length === 0) return null;

        const setSql = keys.map(k => `${k} = ?`).join(", ");
        const values = Object.values(fields);
        values.push(id);

        await pool.query(`UPDATE categories SET ${setSql} WHERE id = ?`, values);
        return this.findById(id);
    }

    async findCategoriesForPost(postId) {
        const [rows] = await pool.query(
            `SELECT c.* FROM categories c
       JOIN post_categories pc ON c.id = pc.category_id
       WHERE pc.post_id = ?`,
            [postId]
        );
        return rows.map(r => this.#mapCategory(r));
    }

    async delete(id) {
        await pool.query("DELETE FROM categories WHERE id = ?", [id]);
    }

    #mapCategory(row) {
        return new Category({
            id: row.id,
            title: row.title,
            description: row.description,
        });
    }
}

module.exports = new CategoryRepository();