import { defineConfig, UserConfigExport } from 'vitest/config';
import _ from '@modern-js/utils/lodash';
import { createSnapshotSerializer } from './utils';

export const testPreset = defineConfig({
  test: {
    coverage: {
      enabled: false,
      // include: ['src/**/*.[jt]s?(x)'],
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

export { defineConfig, createSnapshotSerializer };
