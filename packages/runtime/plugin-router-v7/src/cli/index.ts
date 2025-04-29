import type { AppTools, CliPluginFuture } from '@modern-js/app-tools';
import { logger } from '@modern-js/utils';

export const routerPlugin = (): CliPluginFuture<AppTools> => ({
  name: '@modern-js/plugin-router-v7',
  required: ['@modern-js/runtime'],
  setup: api => {
    api.config(() => {
      const config = api.getNormalizedConfig();
      const alias = config?.source?.alias;
      if (typeof alias !== 'undefined') {
        Object.keys(alias).forEach(key => {
          if (key.includes('react-router')) {
            logger.warn(
              `Checked for possible configuration of react-router alias, using react-router-v7 may fail`,
            );
          }
        });
      }
      return {
        source: {
          alias: {
            'react-router-dom$': require.resolve('../runtime'),
            '@remix-run/router': require.resolve('../runtime'),
            'react-router-dom/server': require.resolve('../runtime'),
          },
          globalVars: {
            'process.env.ROUTER_VERSION': 'v7',
          },
        },
      };
    });
  },
});

export default routerPlugin;
