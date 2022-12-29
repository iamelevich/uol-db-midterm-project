import db from '../lib/db.mjs';
import logger from '../lib/logger.mjs';

/**
 * @typedef {Object} Tag
 * @property {number} tag_id
 * @property {string} tag_name
 */

class TagsRepository {
  #db = db;

  constructor() {}

  /**
   * @description Returns all Tags from DB
   * @returns {Promise<Tag[]>}
   */
  async getAll() {
    const tags = await this.#db.all(
      `SELECT
        tag_id,
        tag_name
      FROM tags
      ORDER BY tag_id ASC;`
    );

    return tags;
  }

  /**
   * Associate article with tags
   * @param {number} article_id
   * @param {number[]} tag_ids
   * @returns {Promise<boolean>}
   */
  async addToArticle(article_id, tag_ids) {
    const result = await this.#db.insertMany(
      'articleToTag',
      ['article_id', 'tag_id'],
      ...tag_ids.map((tag_id) => [article_id, tag_id])
    );
    return result.changes === tag_ids.length;
  }

  /**
   * Update article - tags relations
   * @param {number} article_id
   * @param {number[]} tag_ids
   * @returns
   */
  async updateArticleTags(article_id, tag_ids) {
    await this.#db.run(
      `DELETE FROM articleToTag WHERE article_id = ? AND tag_id NOT IN (?)`,
      article_id,
      tag_ids.join(',')
    );
    const result = await this.#db.insertMany(
      'articleToTag',
      ['article_id', 'tag_id'],
      ...tag_ids.map((tag_id) => [article_id, tag_id])
    );
    return result.changes === tag_ids.length;
  }
}

export default new TagsRepository();
