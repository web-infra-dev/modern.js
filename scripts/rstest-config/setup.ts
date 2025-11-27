import { Console } from 'console';
import path from 'path';
import { expect } from '@rstest/core';
import { createSnapshotSerializer } from 'path-serializer';

global.console.Console = Console;

// Disable chalk in test
process.env.FORCE_COLOR = '0';

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    workspace: path.join(__dirname, '..', '..'),
    replace: [
      {
        mark: 'fragment',
        match: /(?<=\/)modern-js\/stub-builder\/[^/]+\/[^/]+/,
      },
    ],
  }),
);
