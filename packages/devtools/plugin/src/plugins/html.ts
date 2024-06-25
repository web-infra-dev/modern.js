import type { AppTools } from '@modern-js/app-tools';
import type { UserConfig } from '@modern-js/core';
import { SetupClientParams } from '@modern-js/devtools-kit';
import { Plugin } from '../types';

export const pluginHtml: Plugin = {
  name: 'html',
  async setup(api) {
    api.frameworkHooks.hook('config', async () => {
      const { port } = api.vars.http;
      // Inject options to client.
      const clientOptions: SetupClientParams = {
        def: api.context.def,
        src: `http://localhost:${port}/static/html/client/index.html`,
      };
      // Keep resource query always existing.
      Object.assign(clientOptions, { __keep: true });

      const config: UserConfig<AppTools> = {
        source: {
          preEntry: [require.resolve('../runtime')],
          globalVars: {
            'process.env.__USE_MODERNJS_DEVTOOLS__': `http://localhost:${port}/manifest`,
          },
        },
      };
      return config;
    });
  },
};
