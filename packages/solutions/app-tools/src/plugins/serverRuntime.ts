import type { AppTools, CliPluginFuture } from '../types';

export default (): CliPluginFuture<AppTools<'shared'>> => ({
  name: '@modern-js/plugin-server-runtime',
  setup(api) {
    api.config(() => ({
      output: {
        externals: [
          {
            '@modern-js/server-runtime': '@modern-js/server-runtime',
          },
        ],
      },
    }));
    api._internalServerPlugins(({ plugins }) => {
      plugins.push({
        name: '@modern-js/app-tools/server/plugin',
      });
      return { plugins };
    });
  },
});
