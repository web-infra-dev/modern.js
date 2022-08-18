import { normalizeToPosixPath } from '@modern-js/utils';
import { expect } from 'vitest';

export const setPathSerializer = () => {
  expect.addSnapshotSerializer({
    test: val => typeof val === 'string' && /\\/g.test(val),
    print: val => `"${normalizeToPosixPath(val as string)}"`,
  });

  expect.addSnapshotSerializer({
    test: val => typeof val === 'string' && val.includes('node_modules'),
    print: val =>
      `"${normalizeToPosixPath((val as string).split('node_modules').pop())}"`,
  });

  expect.addSnapshotSerializer({
    test: val => typeof val === 'string' && val.includes('packages'),
    print: val =>
      `"${normalizeToPosixPath((val as string).split('packages').pop())}"`,
  });
};
