import { execa } from '@modern-js/utils';

export const CHANGESET_PATH = require.resolve('@changesets/cli');

export function execaWithStreamLog(command: string, args: string[]) {
  const promise = execa(command, args, {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  return promise;
}
