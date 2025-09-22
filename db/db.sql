-- CREATE TABLE IF NOT EXISTS users (
--     id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
--     login VARCHAR(20) NOT NULL UNIQUE,
--     password_hash VARCHAR(255) NOT NULL,
--     full_name VARCHAR(52),
--     email VARCHAR(255) NOT NULL UNIQUE,
--     email_verified BOOLEAN DEFAULT FALSE,
--     profile_picture VARCHAR(255),
--     rating INT DEFAULT 0,
--     role ENUM('user', 'admin') DEFAULT 'user'
-- );

-- CREATE TABLE IF NOT EXISTS categories (
--         id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
--         title VARCHAR(100) NOT NULL UNIQUE,
--         description TEXT
--     );

-- CREATE TABLE IF NOT EXISTS posts (
--     id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
--     author_id INT NOT NULL,
--     title VARCHAR(255) NOT NULL,
--     content TEXT NOT NULL,
--     publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     status ENUM('active', 'inactive') DEFAULT 'active',
--     FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
-- );

-- CREATE TABLE IF NOT EXISTS post_categories (
--     post_id INT NOT NULL,
--     category_id INT NOT NULL,
--     PRIMARY KEY (post_id, category_id),
--     FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
--     FOREIGN KEY (category_id) REFERENCES categories(id)
-- );

-- CREATE TABLE IF NOT EXISTS comments (
--     id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
--     post_id INT NOT NULL,
--     author_id INT NOT NULL,
--     content TEXT NOT NULL,
--     publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     status ENUM('active', 'inactive') DEFAULT 'active',
--     FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
--     FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
-- );

-- CREATE TABLE IF NOT EXISTS likes (
--     id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
--     author_id INT,
--     entity_id INT NOT NULL,
--     entity_type ENUM ('post', 'comment') NOT NULL,
--     type ENUM('like', 'dislike') NOT NULL,
--     publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
--     UNIQUE KEY unique_like (author_id, entity_id, entity_type)
-- );





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

CREATE TABLE IF NOT EXISTS categories (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    author_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    publish_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_categories (
    post_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    author_id INT NOT NULL,
    content TEXT NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    publish_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS favorites (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

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


DELIMITER $$

CREATE TRIGGER trg_posts_after_delete
AFTER DELETE ON posts
FOR EACH ROW
BEGIN
    DELETE FROM likes
    WHERE entity_type = 'post' AND entity_id = OLD.id;
END$$

CREATE TRIGGER trg_comments_after_delete
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
    DELETE FROM likes
    WHERE entity_type = 'comment' AND entity_id = OLD.id;
END$$

DELIMITER ;