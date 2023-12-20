import type { CliPlugin } from '@modern-js/core';
import type { AppTools } from '@modern-js/app-tools';

export const serverPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-server',

  setup: _ => ({
    collectServerPlugins({ plugins }) {
      plugins.push({
        '@modern-js/plugin-server': '@modern-js/plugin-server/server',
      });
      return { plugins };
    },
  }),
});

export default serverPlugin;
