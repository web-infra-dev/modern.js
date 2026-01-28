import {
  type RstestConfig,
  defineConfig,
  mergeRstestConfig,
} from '@rstest/core';
export const testPreset = defineConfig({
  coverage: {
    enabled: false,
  },
  testTimeout: 30000,
  include: ['src/**/*.test.[jt]s?(x)', 'tests/**/*.test.[jt]s?(x)'],
  restoreMocks: true,
  resolve: {
    // Make sure to resolve modern.js packages to their source code in tests because modern.js packages are build slowly in CI.
    conditionNames: ['modern:source', 'require', 'node', 'default'],
  },
});

export const withTestPreset = (config: RstestConfig) => {
  if (config.projects?.length) {
    return defineConfig({
      ...config,
      projects: config.projects.map(projectConfig =>
        mergeRstestConfig(testPreset, projectConfig),
      ),
    });
  }
  const mergedConfig = mergeRstestConfig(testPreset, config);
  return defineConfig(mergedConfig);
};

export { defineConfig };
