import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

// Check if we should use in-memory database
const useInMemoryDb = process.env.USE_IN_MEMORY_DB === 'true' || !process.env.DATABASE_URL;

let pool, query, transaction;

if (useInMemoryDb) {
  // Use in-memory database
  logger.info('Using in-memory database (no PostgreSQL required)');
  const inMemoryDb = await import('./inMemoryDb.js');
  pool = inMemoryDb.pool;
  query = inMemoryDb.query;
  transaction = async (callback) => {
    // In-memory doesn't need real transactions
    return await callback({ query });
  };
} else {
  // Use PostgreSQL
  logger.info('Using PostgreSQL database');
  const pg = await import('pg');
  const { Pool } = pg.default;

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('connect', () => {
    logger.info('✓ PostgreSQL database connected');
  });

  pool.on('error', (err) => {
    logger.error('Unexpected database error:', err);
    process.exit(-1);
  });

  query = async (text, params) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;

      if (process.env.LOG_LEVEL === 'debug') {
        logger.debug('Executed query', { text, duration, rows: res.rowCount });
      }

      return res;
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  };

  transaction = async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await pool.end();
    logger.info('Database pool closed');
  });
}

export { pool, query, transaction };
export default pool;
