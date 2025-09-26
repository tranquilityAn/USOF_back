// const mysql = require("mysql2/promise");
// const dotenv = require("dotenv");
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function initDB() {
    try {
        // Connecting
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
        });

        // Creating DB if not exists
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` 
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        console.log(`Database '${process.env.DB_NAME}' ensured`);

        // Reconnect to usof DB
        await connection.changeUser({ database: process.env.DB_NAME });

        // Tables creating
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                login VARCHAR(32) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                email VARCHAR(254) NOT NULL UNIQUE,
                email_verified BOOLEAN NOT NULL DEFAULT FALSE,
                profile_picture VARCHAR(255),
                rating INT NOT NULL DEFAULT 0,
                role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                author_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
                locked_by_author TINYINT(1) NOT NULL DEFAULT 0,
                publish_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
            );

        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS post_categories (
                post_id INT NOT NULL,
                category_id INT NOT NULL,
                PRIMARY KEY (post_id, category_id),
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                post_id INT NOT NULL,
                author_id INT NOT NULL,
                content TEXT NOT NULL,
                status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
                locked TINYINT(1) NOT NULL DEFAULT 0,
                publish_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS likes (
                id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                author_id INT,
                entity_id INT NOT NULL,
                entity_type ENUM ('post', 'comment') NOT NULL,
                type ENUM('like', 'dislike') NOT NULL,
                publish_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
                UNIQUE KEY unique_like (author_id, entity_id, entity_type)
            );
        `);

        await connection.query(`DROP TRIGGER IF EXISTS trg_likes_after_insert`);
        await connection.query(`
            CREATE TRIGGER trg_likes_after_insert
            AFTER INSERT ON likes
            FOR EACH ROW
            UPDATE users u
            SET u.rating = u.rating + (CASE NEW.type WHEN 'like' THEN 1 ELSE -1 END)
            WHERE u.id = IF(
                NEW.entity_type = 'post',
                (SELECT author_id FROM posts    WHERE id = NEW.entity_id),
                (SELECT author_id FROM comments WHERE id = NEW.entity_id)
            )
        `);

        await connection.query(`DROP TRIGGER IF EXISTS trg_likes_after_delete`);
        await connection.query(`
            CREATE TRIGGER trg_likes_after_delete
            AFTER DELETE ON likes
            FOR EACH ROW
            UPDATE users u
            SET u.rating = u.rating + (CASE OLD.type WHEN 'like' THEN -1 ELSE 1 END)
            WHERE u.id = IF(
                OLD.entity_type = 'post',
                (SELECT author_id FROM posts    WHERE id = OLD.entity_id),
                (SELECT author_id FROM comments WHERE id = OLD.entity_id)
            )
        `);

        await connection.query(`DROP TRIGGER IF EXISTS trg_likes_after_update`);
        await connection.query(`
            CREATE TRIGGER trg_likes_after_update
            AFTER UPDATE ON likes
            FOR EACH ROW
            UPDATE users u
            SET u.rating = u.rating
                + (
                    CASE WHEN u.id = IF(
                    OLD.entity_type = 'post',
                    (SELECT author_id FROM posts    WHERE id = OLD.entity_id),
                    (SELECT author_id FROM comments WHERE id = OLD.entity_id)
                    )
                    THEN (CASE OLD.type WHEN 'like' THEN -1 ELSE 1 END) ELSE 0 END
                )
                + (
                    CASE WHEN u.id = IF(
                    NEW.entity_type = 'post',
                    (SELECT author_id FROM posts    WHERE id = NEW.entity_id),
                    (SELECT author_id FROM comments WHERE id = NEW.entity_id)
                    )
                    THEN (CASE NEW.type WHEN 'like' THEN 1 ELSE -1 END) ELSE 0 END
                )
            WHERE u.id IN (
                IF(
                OLD.entity_type = 'post',
                (SELECT author_id FROM posts    WHERE id = OLD.entity_id),
                (SELECT author_id FROM comments WHERE id = OLD.entity_id)
                ),
                IF(
                NEW.entity_type = 'post',
                (SELECT author_id FROM posts    WHERE id = NEW.entity_id),
                (SELECT author_id FROM comments WHERE id = NEW.entity_id)
                )
            )
        `);


        await connection.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                user_id INT NOT NULL,
                post_id INT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, post_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_tokens (
                token       CHAR(64) PRIMARY KEY,          -- хэш
                user_id     INT NOT NULL,
                type        ENUM('password_reset','email_verify') NOT NULL,
                meta        JSON NULL,                     -- опционально (например, {"email_to_confirm":"new@x.com"})
                expires_at  DATETIME NOT NULL,
                used        BOOLEAN NOT NULL DEFAULT FALSE,
                created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TRIGGER trg_posts_after_delete
            AFTER DELETE ON posts
            FOR EACH ROW
            BEGIN
                DELETE FROM likes
                WHERE entity_type = 'post' AND entity_id = OLD.id;
            END;
        `);

        await connection.query(`
            CREATE TRIGGER trg_comments_after_delete
            AFTER DELETE ON comments
            FOR EACH ROW
            BEGIN
                DELETE FROM likes
                WHERE entity_type = 'comment' AND entity_id = OLD.id;
            END;
        `);

        console.log("Tables created");

        await connection.end();
    } catch (err) {
        console.error("Error initializing DB:", err);
    }
}

//initDB().then(() => process.exit());
await initDB();
process.exit();
