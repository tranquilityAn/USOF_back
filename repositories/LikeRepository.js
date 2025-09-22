// const pool = require("../db/connection");
// const Like = require("../models/Like");

// class LikeRepository {
//     async findByPost(postId) {
//         const [rows] = await pool.query(
//             "SELECT * FROM likes WHERE entity_id = ? AND entity_type = 'post'",
//             [postId]
//         );
//         return rows.map(r => this.#mapLike(r));
//     }

//     async findByUserAndPost(userId, postId) {
//         const [rows] = await pool.query(
//             "SELECT * FROM likes WHERE author_id = ? AND entity_id = ? AND entity_type = 'post'",
//             [userId, postId]
//         );
//         return rows[0] ? this.#mapLike(rows[0]) : null;
//     }

//     async create({ postId, userId }) {
//         const [result] = await pool.query(
//             "INSERT INTO likes (author_id, entity_id, entity_type, type) VALUES (?, ?, 'post', 'like')",
//             [userId, postId]
//         );
//         return new Like({ id: result.insertId, postId, userId });
//     }

//     async delete(id) {
//         await pool.query("DELETE FROM likes WHERE id = ?", [id]);
//     }

//     #mapLike(row) {
//         return new Like({
//             id: row.id,
//             postId: row.entity_id,
//             userId: row.author_id,
//             createdAt: row.publish_date,
//         });
//     }
// }

// module.exports = new LikeRepository();
// repositories/LikeRepository.js
const pool = require("../db/connection");
const Like = require("../models/Like");

class LikeRepository {
  async findByEntity(entityType, entityId) {
    const [rows] = await pool.query(
      "SELECT * FROM likes WHERE entity_id = ? AND entity_type = ?",
      [entityId, entityType]
    );
    return rows.map((r) => this.#mapLike(r));
  }

  async findByUserAndEntity(userId, entityType, entityId) {
    const [rows] = await pool.query(
      "SELECT * FROM likes WHERE author_id = ? AND entity_id = ? AND entity_type = ?",
      [userId, entityId, entityType]
    );
    return rows[0] ? this.#mapLike(rows[0]) : null;
  }

  async create({ userId, entityType, entityId, type = "like" }) {
    const [result] = await pool.query(
      "INSERT INTO likes (author_id, entity_id, entity_type, type) VALUES (?, ?, ?, ?)",
      [userId, entityId, entityType, type]
    );
    return new Like({ id: result.insertId, userId, entityType, entityId, type });
  }

  async updateType(id, type) {
    await pool.query("UPDATE likes SET type = ? WHERE id = ?", [type, id]);
  }

  async delete(id) {
    await pool.query("DELETE FROM likes WHERE id = ?", [id]);
  }

  #mapLike(row) {
    return new Like({
      id: row.id,
      entityId: row.entity_id,
      entityType: row.entity_type,
      userId: row.author_id,
      type: row.type,
      createdAt: row.publish_date,
    });
  }
}

module.exports = new LikeRepository();
