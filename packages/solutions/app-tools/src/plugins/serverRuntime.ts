import type { AppTools, CliPlugin } from '../types';

export default (): CliPlugin<AppTools> => ({
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
  },
});
