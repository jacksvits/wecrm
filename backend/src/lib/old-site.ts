// Подключение к архивной базе MySQL «old_site» (новости RSS-парсера).
// Контейнер old-site-db доступен бэкенду и worker'у по docker-сети.
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function oldSitePool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.OLD_SITE_DB_HOST || 'old-site-db',
      port: Number(process.env.OLD_SITE_DB_PORT || 3306),
      user: process.env.OLD_SITE_DB_USER || 'old_site',
      password: process.env.OLD_SITE_DB_PASSWORD || '',
      database: process.env.OLD_SITE_DB_NAME || 'old_site',
      waitForConnections: true,
      connectionLimit: 3,
      charset: 'utf8mb4',
      connectTimeout: 15_000,
    });
  }
  return pool;
}

/** Таблицы архива новостей RSS-парсера (news/images создаёт old-site-importer). */
export async function ensureRssSchema(): Promise<void> {
  const db = oldSitePool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS rss_feeds (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      site_url TEXT NULL,
      feed_image TEXT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS rss_items (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      feed_id VARCHAR(64) NOT NULL,
      title TEXT NOT NULL,
      permalink TEXT NOT NULL,
      permalink_hash CHAR(64) NOT NULL,
      enclosure_url TEXT NULL,
      summary TEXT NULL,
      content LONGTEXT NOT NULL,
      author VARCHAR(255) NULL,
      news_id VARCHAR(64) NULL,
      news_slug VARCHAR(255) NULL,
      published_at DATETIME NULL,
      fetched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY rss_items_feed_permalink (feed_id, permalink_hash),
      KEY rss_items_published_idx (published_at),
      KEY rss_items_feed_idx (feed_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
