import db from '../lib/db.mjs';

/**
 * @typedef {Object} BlogSetting
 * @property {string} setting_name
 * @property {string} setting_value
 */

class BlogSettingsRepository {
  #db = db;

  constructor() {}

  /**
   * @description Returns all blogSettings entities from DB
   * @returns {Promise<BlogSetting[]>}
   */
  async getAll() {
    const settings = await this.#db.all('SELECT setting_name, setting_value FROM blogSettings;');
    return settings;
  }

  /**
   * Returns sepecific setting by name
   * @param {string} name - setting_name
   * @returns {Promise<BlogSetting | undefined>}
   */
  async getByName(name) {
    const setting = await this.#db.get(
      'SELECT setting_name, setting_value FROM blogSettings WHERE setting_name = ?;',
      name
    );
    return setting;
  }

  /**
   * Updates setting_value by setting_name
   * @param {string} name - setting_name
   * @param {string} value - new setting_value
   * @returns {Promise<boolean>} - Returns true if value was updated, and false otherwise
   */
  async updateByName(name, value) {
    const result = await this.#db.run(
      'UPDATE blogSettings SET setting_value = ? WHERE setting_name = ?',
      value,
      name
    );
    return result.changes > 0;
  }
}

export default new BlogSettingsRepository();
