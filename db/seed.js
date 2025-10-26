import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const RESET = true;
const TOTAL_EXTRA_USERS = 50;
const TOTAL_POSTS = 200;
const MAX_CATEGORIES_PER_POST = 3;
const MAX_COMMENTS_PER_POST = 6;
const POST_LIKERS_MAX = 40;
const FAVORITES_PER_USER_MIN = 5;
const FAVORITES_PER_USER_MAX = 20;
const DAYS_BACK = 365;

function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rndChoice(arr) { return arr[rndInt(0, arr.length - 1)]; }
function rndBool(pTrue = 0.5) { return Math.random() < pTrue; }
function toMySQLDate(d) {
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function randomDateBack(daysBack = 365, afterDate = null) {
    const base = afterDate ? new Date(afterDate) : new Date();
    const offset = rndInt(0, daysBack);
    const d = new Date(base.getTime() - offset * 24 * 60 * 60 * 1000);
    d.setHours(rndInt(0, 23), rndInt(0, 59), rndInt(0, 59), 0);
    return d;
}

async function seedDB() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME,
        multipleStatements: true,
    });

    const q = (sql, params = []) => connection.query(sql, params);

    async function insertMany(table, columns, rows, { ignore = true, onDup = null, chunkSize = 800 } = {}) {
        if (!rows.length) return;
        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            const placeholders = chunk.map(r => `(${new Array(r.length).fill("?").join(",")})`).join(",");
            const sql =
                `INSERT ${ignore ? "IGNORE" : ""} INTO ${table} (${columns.join(",")}) VALUES ${placeholders}` +
                (onDup ? ` ON DUPLICATE KEY UPDATE ${onDup}` : "");
            const flat = chunk.flat();
            await q(sql, flat);
        }
    }

    try {
        console.log("Seeding started...");

        if (RESET) {
            console.log("TRUNCATE tables...");
            await q("SET FOREIGN_KEY_CHECKS=0");
            await q("TRUNCATE TABLE favorites");
            await q("TRUNCATE TABLE likes");
            await q("TRUNCATE TABLE comments");
            await q("TRUNCATE TABLE post_categories");
            await q("TRUNCATE TABLE posts");
            await q("TRUNCATE TABLE categories");
            await q("TRUNCATE TABLE user_tokens");
            await q("TRUNCATE TABLE users");
            await q("SET FOREIGN_KEY_CHECKS=1");
        }

        // ---------- USERS ----------
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash("password123", saltRounds);

        const baseUsers = [
            ['admin', passwordHash, 'Admin User', 'admin@example.com', 'admin', 1, null],
            ['john_doe', passwordHash, 'John Doe', 'john@example.com', 'user', 1, null],
            ['jane_doe', passwordHash, 'Jane Doe', 'jane@example.com', 'user', 0, null],
            ['mike', passwordHash, 'Mike Tyson', 'mike@example.com', 'user', 0, null],
            ['alice', passwordHash, 'Alice W.', 'alice@example.com', 'user', 1, null],
        ];

        const extraUsers = [];
        for (let i = 1; i <= TOTAL_EXTRA_USERS; i++) {
            const login = `user${String(i).padStart(3, "0")}`;
            extraUsers.push([login, passwordHash, `User ${i}`, `${login}@example.com`, 'user', rndBool(0.7) ? 1 : 0, null]);
        }

        await insertMany(
            "users",
            ["login", "password_hash", "full_name", "email", "role", "email_verified", "profile_picture"],
            baseUsers.concat(extraUsers),
            { ignore: true }
        );

        const [userRows] = await q("SELECT id, login FROM users");
        const userByLogin = Object.fromEntries(userRows.map(u => [u.login, u.id]));
        const allUserIds = userRows.map(u => u.id);
        const adminId = userByLogin["admin"];

        // ---------- CATEGORIES ----------
        const categories = [
            ["Programming", "All about coding"],
            ["News", "Fresh news and events"],
            ["Travel", "Travel blogs and tips"],
            ["Food", "Recipes and food stories"],
            ["Science", "Science and discoveries"],
            ["Design", "UI/UX, product & graphic"],
            ["Music", "Music reviews and guides"],
            ["Movies", "Cinema, TV shows and more"],
            ["Sports", "Sport news & analytics"],
            ["Photography", "Shots, gear and tips"],
            ["Gaming", "Games & industry"],
            ["DIY", "Make things with your hands"]
        ];
        await insertMany("categories", ["title", "description"], categories, {
            ignore: false,
            onDup: "description=VALUES(description)"
        });
        const [catRows] = await q("SELECT id, title FROM categories");
        const catIds = catRows.map(c => c.id);

        // ---------- POSTS ----------
        // 200
        const postRows = [];
        for (let i = 1; i <= TOTAL_POSTS; i++) {
            const authorId = rndChoice(allUserIds);
            const status = rndBool(0.8) ? "active" : "inactive";
            const locked = rndBool(0.08) ? 1 : 0;
            const createdAt = randomDateBack(DAYS_BACK);
            const title = `Post #${i} — ${rndChoice(["Tips", "Guide", "Story", "Overview", "Deep Dive", "Opinion"])}`;
            const content = `Autogenerated content for post #${i}. This text is here so you can test full-text length, paging, filters, etc.`;

            postRows.push([
                authorId, title, content, status, locked, toMySQLDate(createdAt), toMySQLDate(createdAt)
            ]);
        }

        await insertMany(
            "posts",
            ["author_id", "title", "content", "status", "locked_by_author", "publish_date", "updated_at"],
            postRows,
            { ignore: true }
        );

        const [postRowsOut] = await q("SELECT id, title, publish_date FROM posts ORDER BY id");
        const postIds = postRowsOut.map(p => p.id);
        const postById = Object.fromEntries(postRowsOut.map(p => [p.id, p]));
        console.log(`Inserted posts: ${postIds.length}`);

        // ---------- POST_CATEGORIES (1-3) ----------
        const pcRows = [];
        for (const postId of postIds) {
            const howMany = rndInt(1, MAX_CATEGORIES_PER_POST);
            const shuffled = [...catIds].sort(() => Math.random() - 0.5).slice(0, howMany);
            for (const catId of shuffled) {
                pcRows.push([postId, catId]);
            }
        }
        await insertMany("post_categories", ["post_id", "category_id"], pcRows, { ignore: true });

        // ---------- COMMENTS (0-6) ----------
        const commentRows = [];
        for (const postId of postIds) {
            const howMany = rndInt(0, MAX_COMMENTS_PER_POST);
            for (let i = 0; i < howMany; i++) {
                const authorId = rndChoice(allUserIds);
                const status = rndBool(0.85) ? "active" : "inactive";
                const basePostDate = postById[postId]?.publish_date || new Date();
                const commentDate = randomDateBack(rndInt(0, 60), basePostDate); 
                const locked = rndBool(0.05) ? 1 : 0;
                commentRows.push([
                    postId,
                    authorId,
                    `Comment ${i + 1} on post ${postId}`,
                    status,
                    locked,
                    toMySQLDate(commentDate),
                    toMySQLDate(commentDate)
                ]);
            }
        }

        await insertMany(
            "comments",
            ["post_id", "author_id", "content", "status", "locked", "publish_date", "updated_at"],
            commentRows,
            { ignore: true }
        );

        const [commentsOut] = await q("SELECT id, post_id, publish_date FROM comments");
        const commentIds = commentsOut.map(c => c.id);
        const commentById = Object.fromEntries(commentsOut.map(c => [c.id, c]));
        console.log(`Inserted comments: ${commentIds.length}`);

        // ---------- LIKES (posts) ----------
        const likeRowsPosts = [];
        for (const postId of postIds) {
            const howManyLikers = rndInt(0, POST_LIKERS_MAX);
            const shuffledUsers = [...allUserIds].sort(() => Math.random() - 0.5).slice(0, howManyLikers);
            for (const uid of shuffledUsers) {
                const type = rndBool(0.85) ? "like" : "dislike";
                const basePostDate = postById[postId]?.publish_date || new Date();
                const likeDate = randomDateBack(rndInt(0, 90), basePostDate);
                likeRowsPosts.push([uid, postId, "post", type, toMySQLDate(likeDate)]);
            }
        }
        await insertMany(
            "likes",
            ["author_id", "entity_id", "entity_type", "type", "publish_date"],
            likeRowsPosts,
            { ignore: true, chunkSize: 1000 }
        );
        console.log(`Inserted post likes (rows attempted): ${likeRowsPosts.length}`);

        // ---------- LIKES (comments) -----------
        const likeRowsComments = [];
        const sampleCommentIds = [...commentIds].sort(() => Math.random() - 0.5).slice(0, Math.floor(commentIds.length * 0.3));
        for (const cid of sampleCommentIds) {
            const howMany = rndInt(0, 8);
            const shuffledUsers = [...allUserIds].sort(() => Math.random() - 0.5).slice(0, howMany);
            for (const uid of shuffledUsers) {
                const type = rndBool(0.9) ? "like" : "dislike";
                const base = commentById[cid]?.publish_date || new Date();
                const likeDate = randomDateBack(rndInt(0, 45), base);
                likeRowsComments.push([uid, cid, "comment", type, toMySQLDate(likeDate)]);
            }
        }
        await insertMany(
            "likes",
            ["author_id", "entity_id", "entity_type", "type", "publish_date"],
            likeRowsComments,
            { ignore: true, chunkSize: 1000 }
        );
        console.log(`Inserted comment likes (rows attempted): ${likeRowsComments.length}`);

        // ---------- FAVORITES (5–20) ----------
        const favRows = [];
        for (const uid of allUserIds) {
            const howMany = rndInt(FAVORITES_PER_USER_MIN, FAVORITES_PER_USER_MAX);
            const chosen = [...postIds].sort(() => Math.random() - 0.5).slice(0, howMany);
            for (const pid of chosen) {
                favRows.push([uid, pid]);
            }
        }
        await insertMany("favorites", ["user_id", "post_id"], favRows, { ignore: true, chunkSize: 1000 });
        console.log(`Inserted favorites (rows attempted): ${favRows.length}`);

        // ---------- USER TOKENS ----------
        await insertMany(
            "user_tokens",
            ["token", "user_id", "type", "meta", "expires_at", "used"],
            [
                ["tok_verify_jane", userByLogin["jane_doe"], "email_verify", "{}", toMySQLDate(new Date(Date.now() + 7 * 864e5)), 0],
                ["tok_reset_mike", userByLogin["mike"], "password_reset", '{"ip":"127.0.0.1"}', toMySQLDate(new Date(Date.now() + 1 * 864e5)), 0],
            ],
            { ignore: true }
        );

        console.log("Seeding complete.");
    } catch (err) {
        console.error("Error seeding DB:", err);
    } finally {
        await connection.end();
    }
}

await seedDB();
process.exit();