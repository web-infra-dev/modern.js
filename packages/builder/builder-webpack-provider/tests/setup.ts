import path from 'path';
// eslint-disable-next-line node/prefer-global/console
import { Console } from 'console';
import { expect } from 'vitest';
import { createSnapshotSerializer } from '@scripts/vitest-config';

global.console.Console = Console;

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    replace: [
      { mark: 'root', match: path.resolve(__dirname, '../../../..') },
      { mark: 'workspace', match: path.resolve(__dirname, '..') },
      {
        mark: 'fragment',
        match: /(?<=\/)modern-js\/stub-builder\/[^/]+\/[^/]+/,
      },
    ],
  }),
);
