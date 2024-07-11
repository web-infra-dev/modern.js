import type { AppTools } from '@modern-js/app-tools';
import type { UserConfig } from '@modern-js/core';
import { Plugin } from '../types';

export const pluginServiceWorker: Plugin = {
  name: 'service-worker',
  async setup(api) {
    if (process.env.NODE_ENV === 'production') {
      api.frameworkHooks.hook('modifyServerRoutes', ({ routes }) => {
        routes.push({
          urlPath: '/sw-devtools.js',
          isSPA: true,
          isSSR: false,
          entryPath: 'public/sw-devtools.js',
        });
      });

      api.frameworkHooks.hook('config', async () => {
        const swProxyEntry = require.resolve(
          '@modern-js/devtools-client/sw-devtools',
        );

        const config: UserConfig<AppTools> = {
          output: {
            copy: [{ from: swProxyEntry, to: 'public' }],
          },
        };
        return config;
      });
    } else {
      api.frameworkHooks.hook('config', async () => {
        const config: UserConfig<AppTools> = {
          tools: {
            devServer: {
              proxy: { '/sw-devtools.js': 'http://localhost:8782/static' },
            },
          },
        };
        return config;
      });
    }
  },
};
