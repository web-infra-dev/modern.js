import { debug as Debugger, chalk } from '@modern-js/utils';

export const debug = Debugger('module');

export const label = (info: string) => {
  return chalk.blue(`[${info.toUpperCase()}]`);
};

export const debugResolve = Debugger('module:resolve');
