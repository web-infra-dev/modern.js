import util from 'util';
import { SpyInstance } from 'vitest';
import stripAnsi from '@modern-js/utils/strip-ansi';

export const useOutput = () => {
  let buf = '';
  const log = (...args: any[]) => {
    buf += util.format(...args);
    buf += '\n';
  };
  const handle = (out: any) => log(out);
  const toString = () => buf;
  return { handle, toString, log };
};

export const cleanOutput = (
  mocked: SpyInstance<Parameters<typeof console.log>>,
) => {
  const { calls } = mocked.mock;
  const ret = [];
  for (const arg of calls) {
    ret.push(arg.map(stripAnsi).join(' '));
  }
  return ret.join('\n');
};
