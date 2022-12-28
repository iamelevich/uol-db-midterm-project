import db from '../lib/db.mjs';
import logger from '../lib/logger.mjs';

/**
 * @typedef {Object} Comment
 * @property {number} comment_id
 * @property {string} comment_text
 * @property {number} comment_creation_date
 * @property {number} article_id
 */

class CommentsRepository {
  #db = db;

  constructor() {}

  /**
   * @description Returns all Comments for specific article entities from DB
   * @param {number} article_id Article ID
   * @returns {Promise<Comment[]>}
   */
  async getForArticle(article_id) {
    const comments = await this.#db.all(
      `SELECT
        comment_id,
        comment_text,
        comment_creation_date,
        article_id
      FROM articleComments
      WHERE article_id = ?
      ORDER BY comment_creation_date DESC;`,
      article_id
    );

    return comments;
  }

  /**
   * Create new comment
   * @param {number} article_id
   * @param {string} text
   * @returns {Promise<boolean>}
   */
  async create(article_id, text) {
    const result = await this.#db.run(
      `INSERT INTO articleComments(comment_text, article_id) VALUES (?, ?)`,
      text,
      article_id
    );
    return result.changes > 0;
  }
}

export default new CommentsRepository();
