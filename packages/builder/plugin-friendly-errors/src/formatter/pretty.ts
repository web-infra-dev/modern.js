import chalk from '@modern-js/utils/chalk';
import { ErrorFormatter } from '../shared/types';

export const prettyFormatter: ErrorFormatter = e => {
  const message = e.message || e;
  const name = e.name || 'Error';

  const formattedStack = e.trace
    .map(frame => {
      const { file, line, column } = frame;
      return `  at ${chalk.gray(file)}:${line}:${column}`;
    })
    .join('\n');

  return `${chalk.red(`${name}: ${message}`)}\n\n${formattedStack}`;
};
