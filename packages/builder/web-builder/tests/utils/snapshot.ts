import { expect } from 'vitest';

export const setPathSerializer = () => {
  const formatWindowsPath = (val: string) => val.replace(/\\/g, '/');

  expect.addSnapshotSerializer({
    test: val => typeof val === 'string' && val.includes('node_modules'),
    print: val =>
      formatWindowsPath((val as string).split('node_modules').pop()!),
  });

  expect.addSnapshotSerializer({
    test: val => typeof val === 'string' && val.includes('packages'),
    print: val => formatWindowsPath((val as string).split('packages').pop()!),
  });
};
