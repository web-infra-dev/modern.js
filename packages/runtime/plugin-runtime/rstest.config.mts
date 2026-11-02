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
      name: 'plugin-runtime-node',
      testEnvironment: 'node',
      output: {
        bundleDependencies: ['@modern-js/render', 'react-server-dom-rspack'],
      },
      exclude: [
        'tests/application/browser.test.tsx',
        'tests/ssr/browserHydration.test.tsx',
        'tests/router/prefetch.test.tsx',
        'tests/router/routeScopeBrowser.test.tsx',
        'tests/router/remoteNavigation.test.tsx',
        'tests/router/remoteNavigationIdentity.test.tsx',
      ],
      extends: commonConfig,
      plugins: [
        {
          name: 'plugin-runtime-node',
          setup: api => {
            api.transform(
              { test: /document[\\/]+cli[\\/]+index\.ts$/ },
              ({ code }: { code: string }) => {
                return code.replace(
                  "require.resolve('../')",
                  `require.resolve('../index.ts', {
        paths: [__dirname],
      });`,
                );
              },
            );
          },
        },
      ],
    }),
    withTestPreset({
      name: 'plugin-runtime-client',
      testEnvironment: 'happy-dom',
      output: {
        bundleDependencies: ['@modern-js/render', 'react-server-dom-rspack'],
      },
      include: [
        'tests/application/browser.test.tsx',
        'tests/ssr/browserHydration.test.tsx',
        'tests/router/prefetch.test.tsx',
        'tests/router/routeScopeBrowser.test.tsx',
        'tests/router/remoteNavigation.test.tsx',
        'tests/router/remoteNavigationIdentity.test.tsx',
      ],
      extends: commonConfig,
      plugins: [
        {
          name: 'plugin-runtime-node',
          setup: api => {
            api.transform(
              { test: /PrefetchLink\.tsx$/ },
              ({
                code,
                resourcePath,
              }: {
                code: string;
                resourcePath: string;
              }) => {
                return code.replace(
                  '__webpack_chunk_load__',
                  '__webpack_chunk_load_test__',
                );
              },
            );
          },
        },
      ],
      source: {
        define: {
          WEBPACK_CHUNK_LOAD: '__webpack_chunk_load_test__',
        },
      },
    }),
  ],
};
