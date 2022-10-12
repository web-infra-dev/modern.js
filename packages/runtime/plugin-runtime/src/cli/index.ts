import path from 'path';
import { PLUGIN_SCHEMAS, cleanRequireCache, isReact18 } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import PluginState from '../state/cli';
import PluginSSR from '../ssr/cli';
import PluginRouter from '../router/cli';

export default (): CliPlugin => ({
  name: '@modern-js/runtime',
  post: [
    '@modern-js/plugin-router',
    '@modern-js/plugin-ssr',
    '@modern-js/plugin-state',
    '@modern-js/plugin-design-token',
  ],
  usePlugins: [PluginState(), PluginSSR(), PluginRouter()],
  setup: api => {
    return {
      config() {
        const dir = api.useAppContext().internalDirectory || '';
        process.env.IS_REACT18 = isReact18(path.join(dir, '../../')).toString();
        return {
          runtime: {},
          runtimeByEntries: {},
          source: {
            alias: {
              /**
               * twin.macro inserts styled-components into the code during the compilation process
               * But it will not be installed under the user project.
               * So need to add alias
               */
              'styled-components': require.resolve('styled-components'),
            },
            envVars: ['IS_REACT18'],
          },
        };
      },
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/runtime'];
      },
      async beforeRestart() {
        cleanRequireCache([
          require.resolve('../state/cli'),
          require.resolve('../router/cli'),
          require.resolve('../ssr/cli'),
        ]);
      },
    };
  },
});
