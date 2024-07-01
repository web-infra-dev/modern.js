import type { AppTools } from '@modern-js/app-tools';
import type { UserConfig } from '@modern-js/core';
import { Plugin } from '../types';

export const pluginHtml: Plugin = {
  name: 'html',
  async setup(api) {
    api.frameworkHooks.hook('config', async () => {
      const port = api.vars.http?.port;
      const config: UserConfig<AppTools> = {
        source: {
          preEntry: [require.resolve('../runtime')],
        },
      };
      if (port) {
        config.source ||= {};
        config.source.globalVars = {
          'process.env.__USE_MODERNJS_DEVTOOLS__': `http://localhost:${port}/manifest`,
        };
      }
      return config;
    });
  },
};
