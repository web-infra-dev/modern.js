import { WebpackError } from 'webpack';
import chalk from '@modern-js/utils/chalk';
import type StackTracey from '../../compiled/stacktracey';
import { ErrorFormatter } from '../shared/types';

const formatTraceEntry = (entry: StackTracey.Entry) => {
  const { callee, file, line, column } = entry;
  const prompt = chalk.gray('at');
  let location = '<anonymous>';
  file && (location = file);
  line && (location += `:${line}`);
  column && (location += `:${column}`);
  const sign = `${callee} (${location})`;
  return `    ${prompt} ${sign}`;
};

const SIGN_TEXT = {
  error: ' ERROR ',
  warning: ' WARN ',
  cause: ' CAUSE ',
} as const;

const SIGN_COLOR = {
  error: chalk.bgRed.bold.black,
  warning: chalk.bgYellow.bold.black,
} as const;

/**
 * @example
 * ```plaintext
 * [ ERROR ] ModuleNotFoundError: Module not found: Error: Can't resolve './index.js' in 'foo'
 * ↑ SIGN    ↑ NAME               ↑ MSG
 * ```
 */
export const prettyFormatter: ErrorFormatter = e => {
  const leadings: string[] = [];
  {
    const text = SIGN_TEXT[e.parent ? 'cause' : e.type];
    const sign = SIGN_COLOR[e.type](text);
    leadings.push(sign, ' ');
  }
  {
    const colorize = e.type === 'error' ? chalk.red.bold : chalk.yellow.bold;
    const name = colorize(e.name);
    leadings.push(name, chalk.gray(': '), e.message);
  }
  const ret = [leadings.join('')];

  if (e.raw instanceof WebpackError) {
    typeof e.raw.details === 'string' && ret.push(e.raw.details);
  }
  ret.push(...e.trace.map(formatTraceEntry));

  e.cause && ret.push(prettyFormatter(e.cause)!);

  return ret.join('\n');
};
