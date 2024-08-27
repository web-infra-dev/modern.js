import { createSnapshotSerializer } from '@scripts/vitest-config';
import { expect } from 'vitest';

expect.addSnapshotSerializer(createSnapshotSerializer());
