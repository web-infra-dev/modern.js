import type { AppTools } from '@modern-js/app-tools';
import { CliPlugin } from '@modern-js/core';

export const cliPlugin1 = (): CliPlugin<AppTools> => ({
  name: 'cliPlugin1',

  setup: () => {
    return {
      modifyServerRoutes({ routes }: { routes: any[] }) {
        return {
          routes: routes.concat({
            urlPath: '/api',
            isApi: true,
            entryPath: '',
            isSPA: false,
            isSSR: false,
          }),
        };
      },
    };
  },
});
