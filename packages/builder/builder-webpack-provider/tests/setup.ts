// eslint-disable-next-line node/prefer-global/console
import { Console } from 'console';
import { expect } from 'vitest';
import { createSnapshotSerializer } from '@scripts/vitest-config';

global.console.Console = Console;

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    replace: [
      {
        mark: 'fragment',
        match: /(?<=\/)modern-js\/stub-builder\/[^/]+\/[^/]+/,
      },
      { match: /(?<=at.+?:)\d+:\d+(?=\W)/g, mark: 'pos' },
    ],
  }),
);
