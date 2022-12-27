import db from '../lib/db.mjs';
import logger from '../lib/logger.mjs';

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
 * @property {string|null} [tag_name]
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
   * @param {Object} config
   * @param {number} config.page - page number, start from 1
   * @param {number} config.pageSize - how many items should be on page
   * @returns {Promise<{ articles: Article[], count: number }>}
   */
  async getAll({ page = 1, pageSize = 10 } = {}) {
    const articlesRaw = await this.#db.all(
      this.#generateGetArticlesSql({
        joinTags: true,
        order: 'a.article_created_at DESC',
        page,
        pageSize
      })
    );
    const count = await this.#db.get(this.#generateCountArticlesSql());

    return {
      articles: this.#transformRawToObject(articlesRaw),
      count: count.articlesCount
    };
  }

  /**
   * @description Returns all Article entities from DB
   * @param {Object} config
   * @param {number} config.page - page number, start from 1
   * @param {number} config.pageSize - how many items should be on page
   * @returns {Promise<{ articles: Article[], count: number }>}
   */
  async getPublished({ page = 1, pageSize = 10 } = {}) {
    const articlesRaw = await this.#db.all(
      this.#generateGetArticlesSql({
        joinTags: true,
        where: 'a.article_status = ?',
        order: 'a.article_published_at DESC',
        page,
        pageSize
      }),
      STATUSES.PUBLISHED
    );

    const count = await this.#db.get(
      this.#generateCountArticlesSql({
        where: 'a.article_status = ?'
      }),
      STATUSES.PUBLISHED
    );

    return {
      articles: this.#transformRawToObject(articlesRaw),
      count: count.articlesCount
    };
  }

  /**
   *
   * @param {Object} config
   * @param {string} [config.where] - WHERE clause. Example: 'a.article_status = ?'
   * @returns {string} SQL query
   */
  #generateCountArticlesSql({ where = undefined } = {}) {
    const sql = `SELECT COUNT(a.article_id) as articlesCount
      FROM articles a
      ${where ? `WHERE ${where}` : ''};`;
    logger.debug(sql, 'Articles count SQL query');
    return sql;
  }

  /**
   * Generates query to get articles
   * @param {Object} config
   * @param {boolean} config.joinTags - need to join tags table
   * @param {number} [config.page] - page number, start from 1
   * @param {number} [config.pageSize] - how many items should be on page
   * @param {string} [config.where] - WHERE clause. Example: 'a.article_status = ?'
   * @param {string} [config.order] - ORDER BY clause. Example: 'a.article_published_at DESC'
   * @returns {string} SQL query
   */
  #generateGetArticlesSql({
    joinTags = false,
    page = undefined,
    pageSize = undefined,
    where = undefined,
    order = undefined
  } = {}) {
    let sql = `SELECT
      a.article_id,
      a.article_title,
      a.article_subtitle,
      a.article_text,
      a.article_url,
      a.article_created_at,
      a.article_updated_at,
      a.article_published_at,
      a.article_deleted_at,
      a.article_status${
        joinTags
          ? `,
      group_concat(t.tag_name) AS tags`
          : ''
      }
    FROM articles a
    ${
      joinTags
        ? `LEFT JOIN articleToTag  at ON a.article_id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.tag_id`
        : ''
    }
    ${where ? `WHERE ${where}` : ''}
    GROUP BY a.article_id
    ${order ? `ORDER BY ${order}` : ''}
    ${pageSize ? `LIMIT ${pageSize}` : ''}
    ${page && pageSize && pageSize > 0 && page > 0 ? `OFFSET ${(page - 1) * pageSize}` : ''};`;
    logger.debug(sql, 'Articles SQL query');
    return sql;
  }

  /**
   * Transform raw DB data to JS objects with tags array
   * @param {ArticleRaw[]} articlesRaw
   * @returns {Article[]}
   */
  #transformRawToObject(articlesRaw) {
    return articlesRaw.map((articleRaw) => {
      return {
        ...articleRaw,
        tags: articleRaw.tags != null ? articleRaw.tags.split(',') : []
      };
    });
  }
}

export default new ArticlesRepository();

export { STATUSES };
