import path from 'path';
import { expect } from 'vitest';
import { createSnapshotSerializer } from '@scripts/vitest-config';

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    replace: [{ mark: 'root', match: path.resolve(__dirname, '../../../..') }],
  }),
);
