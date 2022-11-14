import chalk from '@modern-js/utils/chalk';
import type StackTracey from 'stacktracey';
import { ErrorFormatter } from '../shared/types';

const formatTraceEntry = (entry: StackTracey.Entry) => {
  const { file: filename, line, column } = entry;
  const prompt = chalk.gray('at');
  const pos = chalk.gray(`:${line}:${column}`);
  return `    ${prompt} ${filename}${pos}`;
};

const ERROR_SIGN = {
  error: chalk.bgRed.bold(' ERROR '),
  warning: chalk.bgYellow.bold(' WARN '),
} as const;

export const prettyFormatter: ErrorFormatter = e => {
  const message = e.message || e;
  const name = e.name || 'Error';

  const errorSign = ERROR_SIGN[e.type];
  const errorName =
    e.type === 'error' ? chalk.red.bold(name) : chalk.yellow.bold(name);
  const connector = chalk.gray(':');
  const title = `${errorSign} ${errorName}${connector} ${message}`;
  const formattedStack = e.trace.map(formatTraceEntry).join('\n');

  let ret = `${title}\n${formattedStack}`;
  if (e.causes.length) {
    ret += `\n${prettyFormatter(e.causes[0])}`;
  }
  return ret;
};
