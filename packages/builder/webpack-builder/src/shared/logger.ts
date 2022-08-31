import chalk from '@modern-js/utils/chalk';

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
