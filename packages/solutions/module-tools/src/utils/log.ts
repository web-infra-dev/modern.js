import chalk from '@modern-js/utils/chalk';

export const withLogTitle = (titleText: string, message: string) =>
  `${message} ${chalk.gray(`[${titleText}]`)}`;
