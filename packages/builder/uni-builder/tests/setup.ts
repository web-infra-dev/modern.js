// eslint-disable-next-line node/prefer-global/console
import { Console } from 'console';
import { expect } from 'vitest';
import { createSnapshotSerializer } from '@scripts/vitest-config';

global.console.Console = Console;

// Disable chalk in test
process.env.FORCE_COLOR = '0';

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    replace: [
      {
        mark: 'fragment',
        match: /(?<=\/)modern-js\/stub-builder\/[^/]+\/[^/]+/,
      },
    ],
  }),
);
