import db from '../lib/db.mjs';
import logger from '../lib/logger.mjs';
import tagsRepository from './tagsRepository.mjs';

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
 * @property {number} article_views
 * @property {string} article_status
 * @property {number} likes
 * @property {0|1}    isLiked
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
 * @property {number} article_views
 * @property {string} article_status
 * @property {number} likes
 * @property {0|1}    isLiked
 * @property {string|null} [tag_name]
 */

/**
 * @typedef {Object} NewArticleBody
 * @property {string} article_title
 * @property {string} article_subtitle
 * @property {string} article_text
 * @property {string} article_url
 */

/**
 * @typedef {Object} ArticleForEdit
 * @property {number} article_id
 * @property {string} article_title
 * @property {string} article_subtitle
 * @property {string} article_text
 * @property {string} article_url
 * @property {number[]} tag_ids
 */

const STATUSES = {
  PUBLISHED: 'Published',
  DRAFT: 'Draft',
  DELETED: 'Deleted'
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
        joinLikes: true,
        where: 'a.article_status != ?',
        order: 'a.article_updated_at DESC',
        page,
        pageSize
      }),
      STATUSES.DELETED
    );
    const count = await this.#db.get(
      this.#generateCountArticlesSql({
        where: 'a.article_status != ?'
      }),
      STATUSES.DELETED
    );

    return {
      articles: this.#transformRawsToObject(articlesRaw),
      count: count.articlesCount
    };
  }

  /**
   * @description Returns all Article entities from DB
   * @param {string} session_id - SessionID from req.sessionID
   * @param {Object} config
   * @param {number} config.page - page number, start from 1
   * @param {number} config.pageSize - how many items should be on page
   * @returns {Promise<{ articles: Article[], count: number }>}
   */
  async getPublished(session_id, { page = 1, pageSize = 10 } = {}) {
    const articlesRaw = await this.#db.all(
      this.#generateGetArticlesSql({
        joinTags: true,
        joinLikes: true,
        addIsLiked: true,
        where: 'a.article_status = ?',
        order: 'a.article_published_at DESC',
        page,
        pageSize
      }),
      STATUSES.PUBLISHED,
      session_id
    );

    const count = await this.#db.get(
      this.#generateCountArticlesSql({
        where: 'a.article_status = ?'
      }),
      STATUSES.PUBLISHED
    );

    return {
      articles: this.#transformRawsToObject(articlesRaw),
      count: count.articlesCount
    };
  }

  /**
   * Get article data for edit page
   * @param {number} article_id
   * @returns {Promise<ArticleForEdit|undefined>}
   */
  async getByIdForEdit(article_id) {
    const articleRaw = await this.#db.get(
      `SELECT
        a.article_id,
        a.article_title,
        a.article_subtitle,
        a.article_text,
        a.article_url,
        group_concat(t.tag_id) AS tag_ids
      FROM articles a
      LEFT JOIN articleToTag  at ON a.article_id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.tag_id
      WHERE a.article_id = ? AND a.article_status IN (?, ?)
      GROUP BY a.article_id;`,
      article_id,
      STATUSES.PUBLISHED,
      STATUSES.DRAFT
    );
    logger.debug(
      {
        article_id,
        articleRaw
      },
      'Getting article for edit by ID'
    );
    return articleRaw
      ? {
          ...articleRaw,
          tag_ids: articleRaw.tag_ids ? articleRaw.tag_ids.split(',') : []
        }
      : undefined;
  }

  /**
   * Get Article by slug
   * @param {string} slug - Url of the article
   * @param {string} session_id - SessionID from req.sessionID
   * @returns {Promise<Article> | undefined} If article not found - return undefined, otherwise article object
   */
  async getBySlug(slug, session_id) {
    const articleRaw = await this.#db.get(
      this.#generateGetArticlesSql({
        joinTags: true,
        joinLikes: true,
        addIsLiked: true,
        where: 'a.article_url = ? AND a.article_status = ?'
      }),
      slug,
      STATUSES.PUBLISHED,
      session_id
    );
    logger.debug(
      {
        slug,
        articleRaw
      },
      'Getting article by slug'
    );
    const article = articleRaw ? this.#transformRawToObject(articleRaw) : undefined;
    return article;
  }

  /**
   * Set article status to deleted
   * @param {number} article_id - Article ID
   * @returns {Promise<boolean>}
   */
  async delete(article_id) {
    const result = await this.#db.run(
      'UPDATE articles SET article_deleted_at = ?, article_status = ? WHERE article_id = ?',
      new Date().valueOf(),
      STATUSES.DELETED,
      article_id
    );
    return result.changes > 0;
  }

  /**
   * Set article status to published
   * @param {number} article_id - Article ID
   * @returns {Promise<boolean>}
   */
  async publish(article_id) {
    const currentTime = new Date().valueOf();
    const result = await this.#db.run(
      'UPDATE articles SET article_updated_at = ?, article_published_at = ?, article_status = ? WHERE article_id = ?',
      currentTime,
      currentTime,
      STATUSES.PUBLISHED,
      article_id
    );
    return result.changes > 0;
  }

  /**
   * Set article status to unpublish
   * @param {number} article_id - Article ID
   * @returns {Promise<boolean>}
   */
  async unpublish(article_id) {
    const currentTime = new Date().valueOf();
    const result = await this.#db.run(
      'UPDATE articles SET article_updated_at = ?, article_published_at = ?, article_status = ? WHERE article_id = ?',
      currentTime,
      null,
      STATUSES.DRAFT,
      article_id
    );
    return result.changes > 0;
  }

  /**
   * Like article
   * @param {number} article_id - Article ID
   * @param {string} session_id - Session ID from req.sessionID
   * @returns {Promise<boolean>}
   */
  async like(article_id, session_id) {
    const result = await this.#db.replace('articleLikes', {
      article_id,
      session_id
    });
    return result.changes > 0;
  }

  /**
   * Unlike article
   * @param {number} article_id - Article ID
   * @param {string} session_id - Session ID from req.sessionID
   * @returns {Promise<boolean>}
   */
  async unlike(article_id, session_id) {
    const result = await this.#db.run(
      'DELETE FROM articleLikes WHERE article_id = ? AND session_id = ?',
      article_id,
      session_id
    );
    return result.changes > 0;
  }

  /**
   * Update article views
   * @param {number} article_id - Article ID
   * @returns {Promise<boolean>}
   */
  async view(article_id) {
    const result = await this.#db.run(
      'UPDATE articles SET article_views = article_views + 1 WHERE article_id = ?',
      article_id
    );
    return result.changes > 0;
  }

  /**
   * Update article views by slug
   * @param {string} slug - Url of the article
   * @returns {Promise<boolean>}
   */
  async viewBySlug(slug) {
    const result = await this.#db.run(
      'UPDATE articles SET article_views = article_views + 1 WHERE article_url = ?',
      slug
    );
    return result.changes > 0;
  }

  /**
   * Create new Article
   * @param {NewArticleBody} articleBody
   * @param {number[]} tag_ids - Array of tag id's to associate with article
   * @returns {Promise<boolean>}
   */
  async create(articleBody, tag_ids) {
    const currentTime = new Date().valueOf();
    const result = await this.#db.insert('articles', {
      ...articleBody,
      article_created_at: currentTime,
      article_updated_at: currentTime,
      article_status: STATUSES.DRAFT
    });
    logger.debug(
      {
        articleBody,
        result
      },
      'Creating new article'
    );
    if (!result.changes) {
      return false;
    }

    const article_id = result.lastID;
    return await tagsRepository.addToArticle(article_id, tag_ids);
  }

  /**
   * Update Article
   * @param {ArticleForEdit} articleBody
   * @returns {Promise<boolean>}
   */
  async update(articleBody) {
    const currentTime = new Date().valueOf();
    const result = await this.#db.run(
      `UPDATE articles
      SET
        article_title = ?,
        article_subtitle = ?,
        article_text = ?,
        article_url = ?,
        article_updated_at = ?
      WHERE article_id = ?`,
      articleBody.article_title,
      articleBody.article_subtitle,
      articleBody.article_text,
      articleBody.article_url,
      currentTime,
      articleBody.article_id
    );
    logger.debug(
      {
        articleBody,
        result
      },
      'Updating article'
    );
    if (!result.changes) {
      return false;
    }
    return await tagsRepository.updateArticleTags(articleBody.article_id, articleBody.tag_ids);
  }

  /**
   * Check is given url unique in articles table
   * @param {string} url - URL to check
   * @param {number} [article_id] Article ID to exclude
   * @returns {Promise<boolean>} Return true if url is unique
   */
  async isUrlUnique(url, article_id) {
    const response = await this.#db.get(
      `SELECT article_id FROM articles WHERE article_url = ? ${article_id ? `AND article_id != ?` : ''}`,
      url,
      article_id
    );
    return !response;
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
    joinLikes = false,
    addIsLiked = false,
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
      a.article_views,
      a.article_status${
        joinTags
          ? `,
      group_concat(t.tag_name) AS tags`
          : ''
      }
    FROM articles a
    ${
      joinTags
        ? `LEFT JOIN articleToTag at ON a.article_id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.tag_id`
        : ''
    }
    ${where ? `WHERE ${where}` : ''}
    GROUP BY a.article_id`;

    if (joinLikes) {
      sql = `SELECT
        a.*,
        COUNT(al.session_id) AS likes${
          addIsLiked
            ? `,
        SUM(al.yourLike) isLiked`
            : ''
        }
      FROM (${sql}) a
      LEFT JOIN (
        SELECT
          article_id,
          session_id${
            addIsLiked
              ? `,
          CASE
            WHEN session_id = ? THEN
              1
            ELSE
              0
            END yourLike`
              : ''
          }
        FROM articleLikes
      ) al ON a.article_id = al.article_id
      GROUP BY a.article_id`;
    }

    // Add ORDER BY
    if (order) {
      sql += `\nORDER BY ${order}`;
    }

    // Add LIMIT
    if (pageSize) {
      sql += `\nLIMIT ${pageSize}`;
    }

    // ADD OFFSET
    if (page && pageSize && pageSize > 0 && page > 0) {
      sql += `\nOFFSET ${(page - 1) * pageSize}`;
    }

    logger.debug(sql, 'Articles SQL query');
    return sql;
  }

  /**
   * Transform raw DB data to JS object with tags array
   * @param {ArticleRaw} articleRaw
   * @returns {Article}
   */
  #transformRawToObject(articleRaw) {
    return {
      ...articleRaw,
      tags: articleRaw.tags != null ? articleRaw.tags.split(',') : []
    };
  }

  /**
   * Transform raw DB data to JS objects with tags array
   * @param {ArticleRaw[]} articlesRaw
   * @returns {Article[]}
   */
  #transformRawsToObject(articlesRaw) {
    return articlesRaw.map(this.#transformRawToObject);
  }
}

export default new ArticlesRepository();

export { STATUSES };
