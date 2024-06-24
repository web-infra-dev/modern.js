import type { AppTools } from '@modern-js/app-tools';
import type { UserConfig } from '@modern-js/core';
import { Plugin } from '../types';

export const pluginServiceWorker: Plugin = {
  async setup(api) {
    api.frameworkHooks.hook('modifyServerRoutes', ({ routes }) => {
      routes.push({
        urlPath: '/sw-proxy.js',
        isSPA: true,
        isSSR: false,
        entryPath: 'public/sw-proxy.js',
      });
    });

    api.frameworkHooks.hook('config', async () => {
      const swProxyEntry = require.resolve(
        '@modern-js/devtools-client/sw-proxy',
      );

      const config: UserConfig<AppTools> = {
        output: {
          copy: [{ from: swProxyEntry, to: 'public' }],
        },
      };
      return config;
    });
  },
};
