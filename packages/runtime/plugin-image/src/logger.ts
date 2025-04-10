import { createLogger } from 'rslog';

const logger = createLogger();

export const isDebug = (): boolean => {
  if (!process.env.DEBUG) return false;

  const values = process.env.DEBUG.toLocaleLowerCase().split(',');
  return ['modernjs:image', 'modernjs:*', '*'].some(key =>
    values.includes(key),
  );
};

// setup the logger level
if (isDebug()) {
  logger.level = 'verbose';
}

export { logger };
