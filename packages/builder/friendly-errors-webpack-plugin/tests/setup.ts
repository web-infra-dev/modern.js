// eslint-disable-next-line node/prefer-global/console
import { Console } from 'console';
import { expect } from 'vitest';
import { createSnapshotSerializer } from '@scripts/vitest-config';

global.console.Console = Console;

export const snapshotSerializer = createSnapshotSerializer({
  replace: [
    { match: /(?<=at.+?:)\d+:\d+(?=\W)/g, mark: 'pos' },
    { match: /(?:\s+at .*)+/g, mark: 'stack' },
  ],
});

expect.addSnapshotSerializer(snapshotSerializer);
