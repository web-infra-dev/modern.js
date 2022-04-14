import { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
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
