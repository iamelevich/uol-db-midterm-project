
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

--create your tables with SQL commands here (watch out for slight syntactical differences with SQLite)

CREATE TABLE IF NOT EXISTS blogSettings (
    setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_name TEXT UNIQUE NOT NULL,
    setting_value TEXT NULL DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS articles (
    article_id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_title TEXT NOT NULL,
    article_subtitle TEXT NOT NULL,
    article_text TEXT NOT NULL,
    article_url TEXT UNIQUE NOT NULL,
    article_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    article_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    article_deleted_at TIMESTAMP NULL DEFAULT NULL,
    article_status TEXT CHECK( article_status IN ("Published", "Draft", "Deleted") ) NOT NULL DEFAULT 'Draft'
);

CREATE TABLE IF NOT EXISTS articleComments (
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_text TEXT NOT NULL,
    comment_creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    article_id INT,
    FOREIGN KEY (article_id) REFERENCES articles(article_id)
);

--insert default data (if necessary here)

INSERT INTO blogSettings ("setting_name", "setting_value") VALUES ("blog_title", "My super blog");
INSERT INTO blogSettings ("setting_name", "setting_value") VALUES ("blog_subtitle", "My super blog subtitle");
INSERT INTO blogSettings ("setting_name", "setting_value") VALUES ("blog_author", "Ilya Amelevich");

COMMIT;

