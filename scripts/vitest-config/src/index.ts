import _ from 'lodash';
import { defineConfig, UserConfigExport } from 'vitest/config';
import { createSnapshotSerializer } from './utils';
import { applyMatcherReplacement } from './pathSerializer';

export const testPreset = defineConfig({
  test: {
    coverage: {
      enabled: true,
      include: ['src/**/*.[jt]s?(x)'],
    },
    environment: 'happy-dom',
    testTimeout: 30000,
    include: ['src/**/*.test.[jt]s?(x)', 'tests/**/*.test.[jt]s?(x)'],
    restoreMocks: true,
  },
  resolve: {
    conditions: ['jsnext:source'],
  },
});

export const withTestPreset = (config: UserConfigExport) =>
  _.merge(testPreset, config);

export { defineConfig, createSnapshotSerializer, applyMatcherReplacement };
