import _ from 'lodash';
import { type UserConfigExport, defineConfig } from 'vitest/config';
import { applyMatcherReplacement } from './pathSerializer';
import { createSnapshotSerializer } from './utils';

export const testPreset = defineConfig({
  test: {
    coverage: {
      enabled: false,
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
