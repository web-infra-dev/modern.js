import chalk from '@modern-js/utils/chalk';
import type StackTracey from '../../compiled/stacktracey';
import { ErrorFormatter } from '../shared/types';

const formatTraceEntry = (entry: StackTracey.Entry) => {
  const { callee, file, line, column } = entry;
  const prompt = chalk.gray('at');
  const location =
    (line && column && `${file}:${line}:${column}`) || '<anonymous>';
  const sign = callee
    ? chalk`${callee} {gray (${location})}`
    : chalk.gray(location);
  return `    ${prompt} ${sign}`;
};

const SIGN_TEXT = {
  error: ' ERROR ',
  warning: ' WARN ',
  cause: ' CAUSE ',
} as const;

const SIGN_COLOR = {
  error: chalk.bgRed.bold,
  warning: chalk.bgYellow.bold,
} as const;

export const prettyFormatter: ErrorFormatter = e => {
  const message = e.message || e;
  const name = e.name || 'Error';

  const errorSign = SIGN_COLOR[e.type](SIGN_TEXT[e.isCause ? 'cause' : e.type]);
  const errorName =
    e.type === 'error' ? chalk.red.bold(name) : chalk.yellow.bold(name);
  const connector = chalk.gray(':');
  const ret = [];
  ret.push(`${errorSign} ${errorName}${connector} ${message}\n`);
  typeof e.details === 'string' && ret.push(e.details, '\n');
  ret.push(e.trace.map(formatTraceEntry).join('\n'));
  e.causes.length && ret.push('\n', prettyFormatter(e.causes[0]));

  return ret.join('');
};
