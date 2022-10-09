import chalk from '@modern-js/utils/chalk';
<<<<<<< HEAD
import { logger } from '@modern-js/utils/logger';

export const isDebug = () => process.env.DEBUG === 'builder';

=======

export const isDebug = () => process.env.DEBUG === 'builder';

const log = (message = '') => {
  // eslint-disable-next-line no-console
  console.log(message);
};

const info = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(`${chalk.cyan.bold('info')} ${message}`);
};

const warn = (message: string) => {
  console.warn(`${chalk.yellow.bold('warn')} ${message}`);
};

const error = (message: string | Error) => {
  console.error(`${chalk.red.bold('error')} ${message}`);
};

>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
export const debug = (message: string | (() => string)) => {
  if (isDebug()) {
    const { performance } = require('perf_hooks');
    const result = typeof message === 'string' ? message : message();
    const time = chalk.gray(`[${performance.now().toFixed(2)} ms]`);
    console.error(`${chalk.yellow.bold('debug')} ${result} ${time}`);
  }
};

<<<<<<< HEAD
export { logger };
=======
export const logger = {
  log,
  info,
  warn,
  error,
  debug,
};
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
