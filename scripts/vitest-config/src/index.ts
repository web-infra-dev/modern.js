import { defineConfig, UserConfigExport } from 'vitest/config';
import _ from 'lodash';
import { normalizeToPosixPath } from '@modern-js/utils';
import { expect as _expect } from 'vitest';

export const testPreset = defineConfig({
  test: {
    coverage: {
      enabled: true,
      include: ['src/**/*.[jt]s?(x)'],
    },
    environment: 'happy-dom',
    testTimeout: 15000,
    include: ['src/**/*.test.[jt]s?(x)', 'tests/**/*.test.[jt]s?(x)'],
  },
  resolve: {
    conditions: ['jsnext:source', 'require', 'node', 'default'],
    extensions: ['.js', '.json', '.node', '.ts', '.tsx'],
  },
});

export const withTestPreset = (config: UserConfigExport) =>
  _.merge(testPreset, config);

export const addSnopshotSerializer = (expect: typeof _expect) => {
  expect.addSnapshotSerializer({
    test: val => typeof val === 'string' && /\\/g.test(val),
    print: val => `"${normalizeToPosixPath(val as string)}"`,
  });

  expect.addSnapshotSerializer({
    test: val => typeof val === 'string' && val.includes('node_modules'),
    print: val =>
      `"<NODE_MODULES>${normalizeToPosixPath(
        (val as string).split('node_modules').pop(),
      )}"`,
  });

  expect.addSnapshotSerializer({
    test: val => typeof val === 'string' && val.includes('packages'),
    print: val =>
      `"<ROOT>/packages${normalizeToPosixPath(
        (val as string).split('packages').pop(),
      )}"`,
  });
};
