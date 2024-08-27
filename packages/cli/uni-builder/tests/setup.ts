import { Console } from 'console';
import { createSnapshotSerializer } from '@scripts/vitest-config';
import { expect } from 'vitest';

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
