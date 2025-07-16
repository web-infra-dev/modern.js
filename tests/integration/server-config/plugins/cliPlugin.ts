import type { AppTools, CliPluginFuture } from '@modern-js/app-tools';

export const cliPlugin1 = (): CliPluginFuture<AppTools> => ({
  name: 'cliPlugin1',

  setup: api => {
    api.modifyServerRoutes(({ routes }: { routes: any[] }) => {
      return {
        routes: routes.concat({
          urlPath: '/api',
          isApi: true,
          entryPath: '',
          isSPA: false,
          isSSR: false,
        }),
      };
    });
  },
});
