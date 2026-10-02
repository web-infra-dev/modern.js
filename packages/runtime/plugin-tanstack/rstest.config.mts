import path from 'node:path';
import type { ProjectConfig } from '@rstest/core';
import { withTestPreset } from '@scripts/rstest-config';

const commonConfig: ProjectConfig = {
  setupFiles: ['@scripts/rstest-config/setup.ts'],
  globals: true,
  resolve: {
    alias: {
      '@modern-js/runtime/context$': path.resolve(
        __dirname,
        '../plugin-runtime/src/core/context/index.ts',
      ),
      '@modern-js/runtime/plugin$': path.resolve(
        __dirname,
        '../plugin-runtime/src/core/plugin/index.ts',
      ),
      '@modern-js/runtime/react$': path.resolve(
        __dirname,
        '../plugin-runtime/src/core/react/index.tsx',
      ),
      '@modern-js/runtime/ssr/server$': path.resolve(
        __dirname,
        '../plugin-runtime/src/core/server/server.ts',
      ),
      '@modern-js/render/client$': path.resolve(
        __dirname,
        '../render/src/client/index.tsx',
      ),
      '@modern-js/render/ssr$': path.resolve(
        __dirname,
        '../render/src/server/ssr/index.ts',
      ),
    },
  },
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
      include: [
        'tests/router/cli.test.ts',
        'tests/router/tanstackTypes.test.ts',
        'tests/router/routeTree.test.ts',
        'tests/ssr/plugin.node.test.tsx',
      ],
      extends: commonConfig,
    }),
    withTestPreset({
      name: 'plugin-tanstack-client',
      testEnvironment: 'happy-dom',
      include: [
        'tests/router/dataMutation.test.tsx',
        'tests/router/prefetchLink.test.tsx',
        'tests/router/hydration.test.tsx',
      ],
      extends: commonConfig,
    }),
  ],
};
