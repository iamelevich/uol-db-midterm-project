import { PromisedDatabase } from 'promised-sqlite3';
import logger from './logger.mjs';

/**
 * Return SQLite instace
 *
 * @returns {Promise<PromisedDatabase>} - SQLite DB instance
 */
async function getDb() {
  const db = new PromisedDatabase();
  try {
    await db.open('./database.db');
    logger.debug('Connected to the DB');
    await db.run('PRAGMA foreign_keys=ON'); // This tells SQLite to pay attention to foreign key constraints
  } catch (err) {
    logger.error(err, 'Connection to the DB error');
    process.exit(1); // Bail out we can't connect to the DB
  }
  return db;
}

const db = await getDb();

export default db;
