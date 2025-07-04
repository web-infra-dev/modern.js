import { sep } from 'path';
import type { AppTools, CliPluginFuture } from '@modern-js/app-tools';
import { isDepExists, logger } from '@modern-js/utils';

export const routerPlugin = (): CliPluginFuture<AppTools> => ({
  name: '@modern-js/plugin-router-v7',
  required: ['@modern-js/runtime'],
  setup: api => {
    api.config(() => {
      const config = api.getNormalizedConfig();
      const appContext = api.getAppContext();
      const alias = config?.source?.alias;
      if (typeof alias !== 'undefined') {
        Object.keys(alias).forEach(key => {
          if (key.includes('react-router')) {
            return logger.error(
              `Checked for possible configuration of react-router alias, using react-router-v7 may fail, please remove the alias first`,
            );
          }
        });
      }

      const hasReactRouterDep = isDepExists(
        appContext.appDirectory,
        'react-router',
      );

      const cjs = `${sep}cjs${sep}`;
      const esm = `${sep}esm${sep}`;
      const runtimeAlias = hasReactRouterDep
        ? 'react-router'
        : require.resolve('../runtime').replace(cjs, esm);

      return {
        resolve: {
          alias: {
            'react-router-dom$': runtimeAlias,
            '@remix-run/router': runtimeAlias,
            'react-router-dom/server$': runtimeAlias,
            [`@${appContext.metaName}/runtime/router/rsc`]: require
              .resolve('../runtime/rsc')
              .replace(/\/cjs\//, '/esm/'),
          },
        },
        source: {
          globalVars: {
            'process.env._MODERN_ROUTER_VERSION': 'v7',
          },
        },
      };
    });
  },
});

export default routerPlugin;
