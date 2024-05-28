import { isReact18 } from '@modern-js/utils';
import type { CliPlugin, AppTools } from '@modern-js/app-tools-v2';
import { Entrypoint } from '@modern-js/types';
import { routerPlugin } from '../router/cli';
import { generateCode } from './code';
import { pluginAlias } from './alias';

export const runtimePlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/runtime',
  post: ['@modern-js/plugin-router'],
  // the order of runtime plugins is affected by runtime hooks, mainly `init` and `hoc` hooks
  usePlugins: [routerPlugin()],
  setup: api => {
    return {
      modifyEntrypoints({ entrypoints }: { entrypoints: Entrypoint[] }) {
        return { entrypoints };
      },
      async beforeCreateCompiler() {
        const appContext = api.useAppContext();
        const resolvedConfig = api.useResolvedConfigContext();
        await generateCode({ appContext, config: resolvedConfig });
      },
      prepare() {
        const { builder, entrypoints, internalDirectory, metaName } =
          api.useAppContext();
        builder?.addPlugins([
          pluginAlias({ entrypoints, internalDirectory, metaName }),
        ]);
      },
      config() {
        const { appDirectory } = api.useAppContext();
        process.env.IS_REACT18 = isReact18(appDirectory).toString();

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
      async beforeRestart() {
        // cleanRequireCache([
        //   require.resolve('../state/cli'),
        //   require.resolve('../router/cli'),
        //   require.resolve('../ssr/cli'),
        // ]);
      },
    };
  },
});

export default runtimePlugin;
