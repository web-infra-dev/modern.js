import { expect } from 'vitest';
import { createSnapshotSerializer } from '@scripts/vitest-config';

expect.addSnapshotSerializer(createSnapshotSerializer());
