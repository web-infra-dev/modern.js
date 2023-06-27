import path from 'path';
// eslint-disable-next-line node/prefer-global/console
import { Console } from 'console';
import { beforeAll, expect } from 'vitest';
import { createSnapshotSerializer } from '@scripts/vitest-config';
import execa from '@modern-js/utils/execa';

global.console.Console = Console;

export const snapshotSerializer = createSnapshotSerializer({
  replace: [
    { match: /(?<=at.+?:)\d+:\d+(?=\W)/g, mark: 'pos' },
    { match: /(?:\s+at .*)+/g, mark: 'stack' },
  ],
});

expect.addSnapshotSerializer(snapshotSerializer);

beforeAll(async () => {
  await execa('pnpm', ['run', 'build'], {
    cwd: path.dirname(__dirname),
    stdio: 'inherit',
  });
});
