import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// eslint-disable-next-line import/no-commonjs
const { logger } = require('@modern-js/utils/logger');

export { logger };
