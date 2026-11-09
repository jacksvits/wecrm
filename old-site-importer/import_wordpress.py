"""Перенос опубликованных новостей WordPress в old_site (MySQL) и WeCRM (PostgreSQL).

Повторный запуск идемпотентен: WordPress ID сохраняется в news.external_id,
изображения дедуплицируются по SHA-256 исходного URL, неудачные загрузки повторяются.
Секреты передаются только через переменные окружения Docker Compose.
"""
from __future__ import annotations

import hashlib
import mimetypes
import os
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

import pymysql
import psycopg
import requests
from bs4 import BeautifulSoup

BATCH_SIZE = max(10, int(os.getenv("IMPORT_BATCH_SIZE", "200")))
WORKERS = max(1, int(os.getenv("IMPORT_WORKERS", "20")))
IMPORT_LIMIT = max(0, int(os.getenv("IMPORT_LIMIT", "0")))
UPLOADS_ROOT = Path(os.getenv("UPLOADS_ROOT", "/uploads"))
CATEGORY_ID = "old_site_korotko_o_svezhem"
CATEGORY_SLUG = "korotko-o-svezhem"
CATEGORY_NAME = "Коротко о свежем"
_thread_local = threading.local()
_failed_attempted: set[str] = set()


def env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if not value:
        raise RuntimeError(f"Не задана переменная окружения {name}")
    return value


def source_connection():
    return pymysql.connect(
        host=env("WORDPRESS_DB_HOST"), database=env("WORDPRESS_DB_NAME"),
        user=env("WORDPRESS_DB_USER"), password=env("WORDPRESS_DB_PASSWORD"),
        charset="utf8mb4", connect_timeout=25, read_timeout=180, write_timeout=60,
        cursorclass=pymysql.cursors.DictCursor,
    )


class SourceDatabase:
    """Держит соединение с Beget и повторяет запрос после сетевого обрыва."""

    def __init__(self) -> None:
        self.connection = None

    def fetchall(self, query: str, params: Any = None) -> list[dict[str, Any]]:
        for attempt in range(6):
            try:
                if self.connection is None:
                    self.connection = source_connection()
                with self.connection.cursor() as cur:
                    cur.execute(query, params)
                    return cur.fetchall()
            except (pymysql.err.OperationalError, pymysql.err.InterfaceError) as exc:
                self.close()
                if attempt == 5:
                    raise
                delay = min(30, 2 ** attempt)
                print(f"Соединение с WordPress MySQL потеряно: {exc}; повтор через {delay} с", flush=True)
                time.sleep(delay)
            finally:
                # Между запросами могут идти долгие загрузки изображений: не держим
                # исходное соединение открытым, чтобы Beget не разрывал его по idle-таймауту.
                self.close()
        raise RuntimeError("Недостижимая ветка повторного подключения")

    def fetchone(self, query: str, params: Any = None) -> dict[str, Any] | None:
        rows = self.fetchall(query, params)
        return rows[0] if rows else None

    def close(self) -> None:
        if self.connection is not None:
            try:
                self.connection.close()
            except Exception:
                pass
            self.connection = None


def archive_connection():
    return pymysql.connect(
        host=env("OLD_SITE_DB_HOST", "old-site-db"), database=env("OLD_SITE_DB_NAME", "old_site"),
        user=env("OLD_SITE_DB_USER", "old_site"), password=env("OLD_SITE_DB_PASSWORD"),
        charset="utf8mb4", connect_timeout=25, read_timeout=120, write_timeout=120,
        autocommit=False, cursorclass=pymysql.cursors.DictCursor,
    )


def prepare_archive(mysql) -> None:
    with mysql.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS news (
                id INT UNSIGNED NOT NULL PRIMARY KEY,
                title TEXT NOT NULL,
                slug VARCHAR(255) NOT NULL,
                original_slug VARCHAR(255) NOT NULL,
                original_url TEXT NOT NULL,
                url TEXT NOT NULL,
                summary TEXT NULL,
                content LONGTEXT NOT NULL,
                original_content LONGTEXT NOT NULL,
                source_url TEXT NULL,
                source_cover_url TEXT NULL,
                cover_image TEXT NULL,
                published_at DATETIME NOT NULL,
                wordpress_modified DATETIME NULL,
                imported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY news_slug_unique (slug),
                KEY news_published_idx (published_at),
                KEY news_source_idx (source_url(191))
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS images (
                url_hash CHAR(64) NOT NULL PRIMARY KEY,
                source_url TEXT NOT NULL,
                local_path TEXT NULL,
                status VARCHAR(20) NOT NULL,
                bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
                error TEXT NULL,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                KEY images_status_idx (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
    mysql.commit()


def prepare_crm(pg) -> str:
    with pg.cursor() as cur:
        cur.execute("SELECT id FROM roles WHERE name='admin' ORDER BY id LIMIT 1")
        role = cur.fetchone()
        if not role:
            raise RuntimeError("В основной базе WeCRM не найдена роль admin")
        cur.execute('SELECT id FROM users WHERE "roleId"=%s ORDER BY id LIMIT 1', (role[0],))
        author = cur.fetchone()
        if not author:
            raise RuntimeError("В основной базе WeCRM не найден администратор")
        cur.execute("""
            INSERT INTO news_categories (id,name,slug,color,"sortOrder")
            VALUES (%s,%s,%s,'#007AFF',50)
            ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name
        """, (CATEGORY_ID, CATEGORY_NAME, CATEGORY_SLUG))
        cur.execute("SELECT id FROM news_categories WHERE slug=%s", (CATEGORY_SLUG,))
        category_id = cur.fetchone()[0]
        cur.execute('SELECT slug,external_id FROM news WHERE slug IS NOT NULL')
        used_slugs = {row[0]: row[1] for row in cur.fetchall()}
    pg.commit()
    return author[0], category_id, used_slugs


def parse_published(value: str | None, fallback: datetime) -> datetime:
    if value:
        try:
            normalized = value.strip().replace("Z", "+00:00")
            normalized = re.sub(r"([+-]\d{2})(\d{2})$", r"\1:\2", normalized)
            parsed = datetime.fromisoformat(normalized)
            if parsed.tzinfo:
                return parsed.astimezone(timezone.utc).replace(tzinfo=None)
            return parsed
        except (ValueError, TypeError):
            pass
    return fallback.replace(tzinfo=None) if fallback.tzinfo else fallback


def image_extension(url: str, content_type: str = "") -> str:
    suffix = Path(unquote(urlparse(url).path)).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".bmp", ".svg"}:
        return suffix
    guessed = mimetypes.guess_extension(content_type.split(";", 1)[0].strip())
    return ".jpg" if guessed == ".jpe" else (guessed or ".jpg")


def http_session() -> requests.Session:
    session = getattr(_thread_local, "session", None)
    if session is None:
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/131.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        })
        _thread_local.session = session
    return session


def normalize_image_url(url: str) -> str:
    """Исправляет ошибочно склеенный CDN-адрес, встречающийся в ленте 3DNews."""
    malformed = "https://3dnews.ruhttps//cdn.3dnews.ru/"
    if url.startswith(malformed):
        return "https://cdn.3dnews.ru/" + url[len(malformed):]
    return url


def url_hash(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()


def existing_images(mysql, urls: set[str]) -> dict[str, dict[str, Any]]:
    if not urls:
        return {}
    hashes = [url_hash(url) for url in urls]
    placeholders = ",".join(["%s"] * len(hashes))
    with mysql.cursor() as cur:
        cur.execute(f"SELECT * FROM images WHERE url_hash IN ({placeholders})", hashes)
        return {row["url_hash"]: row for row in cur.fetchall()}


def download_image(url: str, post_id: int, published: datetime) -> dict[str, Any]:
    digest = url_hash(url)
    result = {"url_hash": digest, "source_url": url, "status": "failed",
              "local_path": None, "bytes": 0, "error": None}
    relative_dir = Path("old_site") / f"{published.year:04d}" / f"{published.month:02d}" / str(post_id)
    destination_dir = UPLOADS_ROOT / relative_dir
    temporary: Path | None = None
    for attempt in range(3):
        try:
            parsed = urlparse(url)
            headers = {"Referer": f"{parsed.scheme}://{parsed.netloc}/"} if parsed.netloc else {}
            with http_session().get(url, stream=True, timeout=(15, 45), headers=headers, allow_redirects=True) as response:
                if response.status_code != 200:
                    raise ValueError(f"HTTP {response.status_code}")
                content_type = response.headers.get("Content-Type", "")
                if content_type and not content_type.lower().startswith(("image/", "application/octet-stream")):
                    raise ValueError(f"не изображение: {content_type}")
                extension = image_extension(response.url or url, content_type)
                local_path = str(relative_dir / f"{digest[:24]}{extension}")
                destination = UPLOADS_ROOT / local_path
                destination_dir.mkdir(parents=True, exist_ok=True)
                temporary = destination.with_name(destination.name + f".tmp-{threading.get_ident()}")
                size = 0
                with temporary.open("wb") as output:
                    for chunk in response.iter_content(128 * 1024):
                        if not chunk:
                            continue
                        size += len(chunk)
                        if size > 40 * 1024 * 1024:
                            raise ValueError("размер больше 40 МБ")
                        output.write(chunk)
                if size == 0:
                    raise ValueError("пустой ответ")
                os.replace(temporary, destination)
                result.update(status="ok", local_path="/uploads/" + local_path, bytes=size, error=None)
                return result
        except Exception as exc:  # сетевые ошибки и повреждённые ответы повторяем
            result["error"] = str(exc)[:1500]
            if temporary and temporary.exists():
                temporary.unlink(missing_ok=True)
            if attempt < 2:
                time.sleep(0.6 * (2 ** attempt))
    return result


def save_image_results(mysql, results: list[dict[str, Any]]) -> None:
    if not results:
        return
    with mysql.cursor() as cur:
        cur.executemany("""
            INSERT INTO images (url_hash,source_url,local_path,status,bytes,error,updated_at)
            VALUES (%(url_hash)s,%(source_url)s,%(local_path)s,%(status)s,%(bytes)s,%(error)s,CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE source_url=VALUES(source_url),local_path=VALUES(local_path),
                status=VALUES(status),bytes=VALUES(bytes),error=VALUES(error),updated_at=CURRENT_TIMESTAMP
        """, results)
    mysql.commit()


def resolve_images(mysql, urls: set[str], post_id: int, published: datetime) -> dict[str, str | None]:
    known = existing_images(mysql, urls)
    mapping: dict[str, str | None] = {}
    pending: list[str] = []
    for url in urls:
        digest = url_hash(url)
        row = known.get(digest)
        if row and row["status"] == "ok" and row["local_path"]:
            disk_path = UPLOADS_ROOT / row["local_path"].removeprefix("/uploads/")
            if disk_path.is_file():
                mapping[url] = row["local_path"]
                continue
        if row and row["status"] == "failed" and digest in _failed_attempted:
            mapping[url] = None
            continue
        pending.append(url)
        mapping[url] = None
    if pending:
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            results = list(pool.map(lambda url: download_image(url, post_id, published), pending))
        save_image_results(mysql, results)
        for row in results:
            if row["status"] == "ok":
                mapping[row["source_url"]] = row["local_path"]
            else:
                _failed_attempted.add(row["url_hash"])
    return mapping


def summary_for(post: dict[str, Any]) -> str:
    excerpt = (post.get("post_excerpt") or "").strip()
    if excerpt:
        return excerpt[:2000]
    text = BeautifulSoup(post.get("post_content") or "", "html.parser").get_text(" ", strip=True)
    return text[:500]


def process_batch(source, mysql, pg, posts: list[dict[str, Any]], author_id: str,
                  category_id: str, used_slugs: dict[str, int | None]) -> int:
    ids = [post["ID"] for post in posts]
    placeholders = ",".join(["%s"] * len(ids))
    metadata_rows = source.fetchall(f"""
        SELECT post_id,meta_key,meta_value FROM wp_postmeta
        WHERE post_id IN ({placeholders})
          AND meta_key IN ('wprss_item_permalink','wprss_item_enclosure','wprss_item_date')
    """, ids)
    metadata: dict[int, dict[str, str]] = {}
    for row in metadata_rows:
        metadata.setdefault(row["post_id"], {})[row["meta_key"]] = row["meta_value"]

    dates = {post["ID"]: parse_published(
        metadata.get(post["ID"], {}).get("wprss_item_date"), post["post_date_gmt"]
    ) for post in posts}
    parsed_content: dict[int, BeautifulSoup] = {}
    url_owners: dict[str, tuple[int, datetime]] = {}
    for post in posts:
        post_id = post["ID"]
        soup = BeautifulSoup(post.get("post_content") or "", "html.parser")
        parsed_content[post_id] = soup
        enclosure = normalize_image_url((metadata.get(post_id, {}).get("wprss_item_enclosure") or "").strip())
        if enclosure.startswith(("http://", "https://")):
            url_owners.setdefault(enclosure, (post_id, dates[post_id]))
        for image in soup.find_all("img"):
            url = normalize_image_url((image.get("src") or image.get("data-src") or image.get("data-original") or "").strip())
            if url.startswith(("http://", "https://")):
                url_owners.setdefault(url, (post_id, dates[post_id]))

    # Все изображения пакета скачиваются параллельно и дедуплицируются по URL.
    representative_id, representative_date = posts[0]["ID"], dates[posts[0]["ID"]]
    if url_owners:
        first_url = next(iter(url_owners))
        representative_id, representative_date = url_owners[first_url]
    image_map = resolve_images(mysql, set(url_owners), representative_id, representative_date)

    archive_rows = []
    crm_rows = []
    for post in posts:
        post_id = post["ID"]
        meta = metadata.get(post_id, {})
        published = dates[post_id]
        original_slug = post["post_name"]
        slug = original_slug
        if slug in used_slugs and used_slugs[slug] != post_id:
            slug = f"{original_slug}-{post_id}"
        if slug in used_slugs and used_slugs[slug] not in (None, post_id):
            raise RuntimeError(f"Не удалось выделить уникальный slug для WordPress ID {post_id}")
        used_slugs[slug] = post_id

        soup = parsed_content[post_id]
        for image in soup.find_all("img"):
            original_image_url = (image.get("src") or image.get("data-src") or image.get("data-original") or "").strip()
            source_url = normalize_image_url(original_image_url)
            local_url = image_map.get(source_url)
            if source_url != original_image_url:
                image["src"] = source_url
            if local_url:
                image["src"] = local_url
                image.attrs.pop("data-src", None)
                image.attrs.pop("data-original", None)
        content = str(soup)
        source_cover = (meta.get("wprss_item_enclosure") or "").strip() or None
        cover_source = normalize_image_url(source_cover or "")
        cover = image_map.get(cover_source) or cover_source or None
        source_url = (meta.get("wprss_item_permalink") or "").strip() or None
        summary = summary_for(post)
        original_url = f"https://welans.ru/{original_slug}/"
        public_url = f"https://welans.ru/{slug}/"
        modified = post.get("post_modified_gmt") or post.get("post_modified")
        archive_rows.append({
            "id": post_id, "title": post["post_title"], "slug": slug,
            "original_slug": original_slug, "original_url": original_url, "url": public_url,
            "summary": summary, "content": content, "original_content": post.get("post_content") or "",
            "source_url": source_url, "source_cover_url": source_cover, "cover_image": cover,
            "published_at": published, "wordpress_modified": modified,
        })
        crm_rows.append((
            f"old_site_{post_id}", post["post_title"], slug, summary, content, cover,
            source_url, post_id, True, published, author_id, category_id, published,
        ))

    with mysql.cursor() as cur:
        cur.executemany("""
            INSERT INTO news (id,title,slug,original_slug,original_url,url,summary,content,original_content,
                source_url,source_cover_url,cover_image,published_at,wordpress_modified,imported_at,updated_at)
            VALUES (%(id)s,%(title)s,%(slug)s,%(original_slug)s,%(original_url)s,%(url)s,%(summary)s,
                %(content)s,%(original_content)s,%(source_url)s,%(source_cover_url)s,%(cover_image)s,
                %(published_at)s,%(wordpress_modified)s,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE title=VALUES(title),original_slug=VALUES(original_slug),
                original_url=VALUES(original_url),url=VALUES(url),summary=VALUES(summary),
                content=VALUES(content),original_content=VALUES(original_content),source_url=VALUES(source_url),
                source_cover_url=VALUES(source_cover_url),cover_image=VALUES(cover_image),
                published_at=VALUES(published_at),wordpress_modified=VALUES(wordpress_modified),
                updated_at=CURRENT_TIMESTAMP
        """, archive_rows)
    mysql.commit()

    with pg.cursor() as cur:
        cur.executemany("""
            INSERT INTO news (id,title,slug,summary,content,cover_image,source_url,external_id,
                is_published,pinned_to_home,published_at,views,labels,"authorId","categoryId",
                "subcategoryId","createdAt","updatedAt")
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,false,%s,0,ARRAY[]::TEXT[],%s,%s,NULL,%s,CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,slug=EXCLUDED.slug,summary=EXCLUDED.summary,
                content=EXCLUDED.content,cover_image=EXCLUDED.cover_image,source_url=EXCLUDED.source_url,
                external_id=EXCLUDED.external_id,is_published=true,published_at=EXCLUDED.published_at,
                "authorId"=EXCLUDED."authorId","categoryId"=EXCLUDED."categoryId","updatedAt"=CURRENT_TIMESTAMP
        """, crm_rows)
    pg.commit()
    return len(posts)


def main() -> None:
    started = time.time()
    source = SourceDatabase()
    mysql = archive_connection()
    pg = psycopg.connect(env("POSTGRES_URL"), connect_timeout=25, autocommit=False)
    try:
        prepare_archive(mysql)
        author_id, category_id, used_slugs = prepare_crm(pg)
        source_total = source.fetchone(
            "SELECT COUNT(*) AS n FROM wp_posts WHERE post_type='post' AND post_status='publish'"
        )["n"]
        target_total = min(source_total, IMPORT_LIMIT) if IMPORT_LIMIT else source_total
        print(f"Найдено опубликованных новостей WordPress: {source_total}; к обработке: {target_total}", flush=True)
        last_id = 0
        processed = 0
        while processed < target_total:
            size = min(BATCH_SIZE, target_total - processed)
            posts = source.fetchall("""
                SELECT ID,post_name,post_title,post_content,post_excerpt,post_date_gmt,
                    post_modified,post_modified_gmt,guid
                FROM wp_posts
                WHERE post_type='post' AND post_status='publish' AND ID>%s
                ORDER BY ID ASC LIMIT %s
            """, (last_id, size))
            if not posts:
                break
            process_batch(source, mysql, pg, posts, author_id, category_id, used_slugs)
            processed += len(posts)
            last_id = posts[-1]["ID"]
            elapsed = max(1, time.time() - started)
            print(f"Перенесено {processed}/{target_total}; скорость {processed/elapsed:.1f} новостей/с", flush=True)
        with mysql.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS n FROM news")
            archive_total = cur.fetchone()["n"]
            cur.execute("SELECT status,COUNT(*) AS n FROM images GROUP BY status")
            image_stats = {row["status"]: row["n"] for row in cur.fetchall()}
            cur.execute("SELECT source_url,error FROM images WHERE status='failed' ORDER BY updated_at DESC LIMIT 20")
            failures = cur.fetchall()
        with pg.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM news WHERE external_id IS NOT NULL")
            crm_total = cur.fetchone()[0]
        print(f"IMPORT_COMPLETE source={source_total} processed={processed} old_site={archive_total} "
              f"wecrm={crm_total} images={image_stats} elapsed={int(time.time()-started)}s", flush=True)
        if failures:
            print("Неудачные загрузки изображений (будут повторены при следующем запуске):", flush=True)
            for row in failures:
                print(f"  {row['source_url']} — {row['error']}", flush=True)
        if not IMPORT_LIMIT and (processed != source_total or archive_total != source_total or crm_total != source_total):
            raise RuntimeError("Итоговое количество записей не совпадает с источником")
    finally:
        pg.close()
        mysql.close()
        source.close()


if __name__ == "__main__":
    main()
