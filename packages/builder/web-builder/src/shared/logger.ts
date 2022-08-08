import chalk from '@modern-js/utils/chalk';

// TODO improve log format
export const log = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(`${chalk.cyan('info')} ${message}`);
};

export const warn = (message: string) => {
  console.warn(`${chalk.yellow('warn')} ${message}`);
};

export const error = (message: string | Error) => {
  console.error(`${chalk.red('error')} ${message}`);
};
