import path from 'path';
import {
  isReact18,
  cleanRequireCache,
  ENTRY_NAME_PATTERN,
} from '@modern-js/utils';
import type { CliPlugin, AppTools } from '@modern-js/app-tools';
import PluginState from '../state/cli';
import PluginSSR from '../ssr/cli';
import PluginRouter from '../router/cli';
import Document from '../document/cli';

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/runtime',
  post: [
    '@modern-js/plugin-ssr',
    '@modern-js/plugin-state',
    '@modern-js/plugin-router',
    '@modern-js/plugin-document',
    '@modern-js/plugin-design-token',
  ],
  // the order of runtime plugins is affected by runtime hooks, mainly `init` and `hoc` hooks
  usePlugins: [PluginSSR(), PluginState(), PluginRouter(), Document()],
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
            globalVars: {
              'process.env.IS_REACT18': process.env.IS_REACT18,
            },
          },
          tools: {
            styledComponents: {
              // https://github.com/styled-components/babel-plugin-styled-components/issues/287
              topLevelImportPaths: ['@modern-js/runtime/styled'],
            },
          },
        };
      },
      validateSchema() {
        return [
          {
            target: 'runtime',
            schema: {
              type: 'object',
              additionalProperties: false,
            },
          },
          {
            target: 'runtimeByEntries',
            schema: {
              type: 'object',
              patternProperties: { [ENTRY_NAME_PATTERN]: { type: 'object' } },
              additionalProperties: false,
            },
          },
        ];
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
