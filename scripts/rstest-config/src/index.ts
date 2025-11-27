import { join } from 'path';
import { type RstestConfig, defineConfig } from '@rstest/core';
import _ from 'lodash';
export const testPreset = defineConfig({
  coverage: {
    enabled: false,
  },
  testEnvironment: 'happy-dom',
  testTimeout: 30000,
  include: ['src/**/*.test.[jt]s?(x)', 'tests/**/*.test.[jt]s?(x)'],
  restoreMocks: true,
  setupFiles: [join(__dirname, '../setup.ts')],
  resolve: {
    conditionNames: ['jsnext:source', 'require', 'node', 'default'],
  },
});

export const withTestPreset = (config: RstestConfig) => {
  const mergedConfig = _.merge({}, testPreset, config);
  if (config.setupFiles) {
    mergedConfig.setupFiles = [...testPreset.setupFiles!, ...config.setupFiles];
  }
  return defineConfig(mergedConfig);
};

export { defineConfig };
