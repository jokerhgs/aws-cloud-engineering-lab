import { serve } from '@hono/node-server';
import logger from './lib/logger.js';
import { checkDatabaseConnection } from './lib/prisma.js';
import app from './app.js';

const port = 3000;

// Check DB connection before starting server
checkDatabaseConnection().then((result) => {
  if (result.connected) {
    logger.info('Database connected successfully');
  } else {
    logger.error(`Database connection failed: ${result.error}`);
  }
});

serve({
  fetch: app.fetch,
  port
}, (info) => {
  logger.info(`Server is running on http://localhost:${info.port}`);
});