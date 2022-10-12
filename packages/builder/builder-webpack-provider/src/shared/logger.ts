import chalk from '@modern-js/utils/chalk';

export const isDebug = () => process.env.DEBUG === 'builder';

export const log = (message = '') => {
  // eslint-disable-next-line no-console
  console.log(message);
};

export const info = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(`${chalk.cyan.bold('info')} ${message}`);
};

export const warn = (message: string) => {
  console.warn(`${chalk.yellow.bold('warn')} ${message}`);
};

export const error = (message: string | Error) => {
  console.error(`${chalk.red.bold('error')} ${message}`);
};

export const debug = (message: string | (() => string)) => {
  if (isDebug()) {
    const { performance } = require('perf_hooks');
    const result = typeof message === 'string' ? message : message();
    const time = chalk.gray(`[${performance.now().toFixed(2)} ms]`);
    console.error(`${chalk.yellow.bold('debug')} ${result} ${time}`);
  }
};

export const logger = {
  log,
  info,
  warn,
  error,
  debug,
};
