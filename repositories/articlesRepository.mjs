import db from '../lib/db.mjs';

/**
 * @typedef {Object} Article
 * @property {number} article_id
 * @property {string} article_title
 * @property {string} article_subtitle
 * @property {string} article_text
 * @property {string} article_url
 * @property {number} article_created_at
 * @property {number} article_updated_at
 * @property {number} article_published_at
 * @property {number} article_deleted_at
 * @property {string} article_status
 * @property {string[]} tags
 */

/**
 * @typedef {Object} ArticleRaw
 * @property {number} article_id
 * @property {string} article_title
 * @property {string} article_subtitle
 * @property {string} article_text
 * @property {string} article_url
 * @property {number} article_created_at
 * @property {number} article_updated_at
 * @property {number} article_published_at
 * @property {number} article_deleted_at
 * @property {string} article_status
 * @property {string} tag_name
 */

const STATUSES = {
  PUBLISHED: 'Published',
  DRAFT: 'Draft'
};

class ArticlesRepository {
  #db = db;

  constructor() {}

  /**
   * @description Returns all Article entities from DB
   * @returns {Promise<Article[]>}
   */
  async getAll() {
    const articlesRaw = await this.#db.all(
      `SELECT
        a.article_id,
        a.article_title,
        a.article_subtitle,
        a.article_text,
        a.article_url,
        a.article_created_at,
        a.article_updated_at,
        a.article_published_at,
        a.article_deleted_at,
        a.article_status,
        t.tag_name
      FROM articles a
      LEFT JOIN articleToTag  at ON a.article_id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.tag_id;`
    );

    return this.#transformRawToObject(articlesRaw);
  }

  /**
   * @description Returns all Article entities from DB
   * @returns {Promise<Article[]>}
   */
  async getPublished() {
    const articlesRaw = await this.#db.all(
      `SELECT
        a.article_id,
        a.article_title,
        a.article_subtitle,
        a.article_text,
        a.article_url,
        a.article_created_at,
        a.article_updated_at,
        a.article_published_at,
        a.article_deleted_at,
        a.article_status,
        t.tag_name
      FROM articles a
      LEFT JOIN articleToTag  at ON a.article_id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.tag_id
      WHERE a.article_status = ?;`,
      STATUSES.PUBLISHED
    );

    return this.#transformRawToObject(articlesRaw);
  }

  /**
   * Transform raw DB data to JS objects with tags array
   * @param {ArticleRaw[]} articlesRaw
   * @returns {Article[]}
   */
  #transformRawToObject(articlesRaw) {
    // Need to transform raw values to objects with tags array
    const articlesMap = new Map();
    for (const articleRaw of articlesRaw) {
      // If article already in map - thats mean that we need to only add new
      if (articlesMap.has(articleRaw.article_id)) {
        const article = articlesMap.get(articleRaw.article_id);
        article.tags.push(articleRaw.tag_name);
      } else {
        const article = {
          article_id: articleRaw.article_id,
          article_title: articleRaw.article_title,
          article_subtitle: articleRaw.article_subtitle,
          article_text: articleRaw.article_text,
          article_url: articleRaw.article_url,
          article_created_at: articleRaw.article_created_at,
          article_updated_at: articleRaw.article_updated_at,
          article_published_at: articleRaw.article_published_at,
          article_deleted_at: articleRaw.article_deleted_at,
          article_status: articleRaw.article_status,
          tags: articleRaw.tag_name != null ? [articleRaw.tag_name] : []
        };
        articlesMap.set(articleRaw.article_id, article);
      }
    }

    // Return only values
    return Array.from(articlesMap, ([key, val]) => val);
  }
}

export default new ArticlesRepository();

export { STATUSES };
