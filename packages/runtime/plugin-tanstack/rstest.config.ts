import type { ProjectConfig } from '@rstest/core';
import { withTestPreset } from '@scripts/rstest-config';

const commonConfig: ProjectConfig = {
  setupFiles: ['@scripts/rstest-config/setup.ts'],
  globals: true,
  tools: {
    swc: {
      jsc: {
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    },
  },
};

export default {
  projects: [
    withTestPreset({
      name: 'plugin-tanstack-node',
      testEnvironment: 'node',
      include: ['tests/router/routeTree.test.ts'],
      extends: commonConfig,
    }),
    withTestPreset({
      name: 'plugin-tanstack-client',
      testEnvironment: 'happy-dom',
      include: ['tests/router/dataMutation.test.tsx'],
      extends: commonConfig,
    }),
  ],
};
