const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");

dotenv.config();

async function seedDB() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME,
        multipleStatements: true,
    });

    try {
        console.log("Seeding started...");

        // ---------- helpers ----------
        const q = (sql, params = []) => connection.query(sql, params);
        const getUserIds = async (logins) => {
            const [rows] = await q(
                `SELECT id, login FROM users WHERE login IN (${logins.map(() => "?").join(",")})`,
                logins
            );
            const map = {};
            rows.forEach(r => map[r.login] = r.id);
            return map;
        };
        const getCategoryIds = async (titles) => {
            const [rows] = await q(
                `SELECT id, title FROM categories WHERE title IN (${titles.map(() => "?").join(",")})`,
                titles
            );
            const map = {};
            rows.forEach(r => map[r.title] = r.id);
            return map;
        };
        const getPostIds = async (titles) => {
            const [rows] = await q(
                `SELECT id, title FROM posts WHERE title IN (${titles.map(() => "?").join(",")})`,
                titles
            );
            const map = {};
            rows.forEach(r => map[r.title] = r.id);
            return map;
        };

        // ---------- users ----------
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash("password123", saltRounds);

        await q(
            `INSERT INTO users (login, password_hash, full_name, email, role, email_verified, profile_picture)
       VALUES 
       ('admin',    ?, 'Admin User', 'admin@example.com', 'admin', TRUE,  NULL),
       ('john_doe', ?, 'John Doe',   'john@example.com',  'user',  TRUE,  NULL),
       ('jane_doe', ?, 'Jane Doe',   'jane@example.com',  'user',  FALSE, NULL),
       ('mike',     ?, 'Mike Tyson', 'mike@example.com',  'user',  FALSE, NULL),
       ('alice',    ?, 'Alice W.',   'alice@example.com', 'user',  TRUE,  NULL)
       ON DUPLICATE KEY UPDATE 
         password_hash=VALUES(password_hash),
         full_name=VALUES(full_name),
         role=VALUES(role)`,
            [passwordHash, passwordHash, passwordHash, passwordHash, passwordHash]
        );

        const U = await getUserIds(["admin", "john_doe", "jane_doe", "mike", "alice"]);

        // ---------- categories ----------
        await q(
            `INSERT INTO categories (title, description)
       VALUES 
       ('Programming','All about coding'),
       ('News','Fresh news and events'),
       ('Travel','Travel blogs and tips'),
       ('Food','Recipes and food stories'),
       ('Science','Science and discoveries')
       ON DUPLICATE KEY UPDATE description=VALUES(description)`
        );
        const C = await getCategoryIds(["Programming", "News", "Travel", "Food", "Science"]);

        // ---------- posts ----------
        await q(
            `INSERT INTO posts (author_id, title, content, status)
       VALUES
       (?, 'Welcome to the blog',        'This is the first post',             'active'),
       (?, 'Node.js Basics',             'Introduction to Node.js',             'active'),
       (?, 'Best Pizza Recipe',          'Step by step guide to making pizza',  'active'),
       (?, 'Top 5 Travel Destinations',  'Places you must visit',               'active'),
       (?, 'AI in 2025',                 'How AI is changing the world',        'active')
       ON DUPLICATE KEY UPDATE content=VALUES(content)`,
            [U.admin, U.john_doe, U.jane_doe, U.mike, U.alice]
        );

        const P = await getPostIds([
            "Welcome to the blog",
            "Node.js Basics",
            "Best Pizza Recipe",
            "Top 5 Travel Destinations",
            "AI in 2025",
        ]);

        // ---------- post_categories (many-to-many) ----------
        // подберём простые соответствия
        const pcRows = [
            [P["Welcome to the blog"], C.News],
            [P["Node.js Basics"], C.Programming],
            [P["Best Pizza Recipe"], C.Food],
            [P["Top 5 Travel Destinations"], C.Travel],
            [P["AI in 2025"], C.Science],
        ].filter(([post_id, category_id]) => post_id && category_id);

        if (pcRows.length) {
            await q(
                `INSERT IGNORE INTO post_categories (post_id, category_id) VALUES ${pcRows.map(() => "(?,?)").join(",")}`,
                pcRows.flat()
            );
        }

        // ---------- comments ----------
        const commentRows = [
            [P["Welcome to the blog"], U.john_doe, "Nice to see this project starting!"],
            [P["Node.js Basics"], U.alice, "Great intro, thanks!"],
            [P["Best Pizza Recipe"], U.mike, "I tried it, turned out perfect."],
            [P["Top 5 Travel Destinations"], U.jane_doe, "Adding Kyoto to my list!"],
            [P["AI in 2025"], U.admin, "AI will be everywhere, indeed."],
        ].filter(([post_id]) => post_id);

        if (commentRows.length) {
            await q(
                `INSERT INTO comments (post_id, author_id, content)
         VALUES ${commentRows.map(() => "(?,?,?)").join(",")}
         ON DUPLICATE KEY UPDATE content=VALUES(content)`,
                commentRows.flat()
            );
        }

        // получим id свежих комментариев (по текстам)
        const [commentIdsRows] = await q(
            `SELECT id, content, post_id FROM comments 
       WHERE content IN (?,?,?,?,?)`,
            commentRows.map(r => r[2])
        );
        // возьмем первую пару для лайков по комменту
        const anyComment = commentIdsRows[0];

        // ---------- likes (на посты и один на комментарий) ----------
        const likeRows = [
            // post likes
            [U.alice, P["Node.js Basics"], "post", "like"],
            [U.john_doe, P["Best Pizza Recipe"], "post", "like"],
            [U.jane_doe, P["AI in 2025"], "post", "dislike"],
            [U.mike, P["Top 5 Travel Destinations"], "post", "like"],
            // comment like (если есть любой комментарий)
            ...(anyComment ? [[U.admin, anyComment.id, "comment", "like"]] : []),
        ].filter(([author_id, entity_id]) => author_id && entity_id);

        if (likeRows.length) {
            await q(
                `INSERT IGNORE INTO likes (author_id, entity_id, entity_type, type)
         VALUES ${likeRows.map(() => "(?,?,?,?)").join(",")}`,
                likeRows.flat()
            );
        }

        // ---------- favorites ----------
        const favRows = [
            [U.john_doe, P["AI in 2025"]],
            [U.jane_doe, P["Top 5 Travel Destinations"]],
            [U.alice, P["Node.js Basics"]],
            [U.mike, P["Best Pizza Recipe"]],
        ].filter(([user_id, post_id]) => user_id && post_id);

        if (favRows.length) {
            await q(
                `INSERT IGNORE INTO favorites (user_id, post_id)
         VALUES ${favRows.map(() => "(?,?)").join(",")}`,
                favRows.flat()
            );
        }

        // ---------- user_tokens (демо для проверки e-mail и сброса пароля) ----------
        // Для безопасности сюда лучше класть ХЭШ токена, а не сам токен.
        // Для примера используем фиктивные строки 'tok_xxx' — представь, что это уже хэши.
        await q(
            `INSERT IGNORE INTO user_tokens (token, user_id, type, meta, expires_at, used)
       VALUES
       ('tok_verify_jane',   ?, 'email_verify',  JSON_OBJECT(),                 NOW() + INTERVAL 7 DAY,  FALSE),
       ('tok_reset_mike',    ?, 'password_reset',JSON_OBJECT('ip','127.0.0.1'), NOW() + INTERVAL 1 DAY,  FALSE)`,
            [U.jane_doe, U.mike]
        );

        console.log("Seeding complete.");
    } catch (err) {
        console.error("Error seeding DB:", err);
    } finally {
        await connection.end();
    }
}

seedDB().then(() => process.exit());
