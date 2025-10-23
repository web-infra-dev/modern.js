import dataFetchMiddleWare from '@module-federation/bridge-react/data-fetch-server-middleware';

import type { ServerPlugin } from '@modern-js/server-runtime';

const dataFetchServePlugin = (): ServerPlugin => ({
  name: 'mf-data-fetch-server-plugin',
  setup: api => {
    api.onPrepare(() => {
      const { middlewares } = api.getServerContext();
      middlewares.push({
        name: 'module-federation-serve-manifest',
        // @ts-ignore type error
        handler: dataFetchMiddleWare,
      });
    });
  },
});

export default dataFetchServePlugin;
