import path from 'path';
import { isReact18, cleanRequireCache } from '@modern-js/utils';
import type { CliPlugin, AppTools } from '@modern-js/app-tools';
import { statePlugin } from '../state/cli';
import { ssrPlugin } from '../ssr/cli';
import { routerPlugin } from '../router/cli';
import { documentPlugin } from '../document/cli';
import { isRuntimeEntry } from './entry';
import { ENTRY_POINT_FILE_NAME } from './constants';
import { generateCode } from './code';
import { pluginAlias } from './alias';

export { isRuntimeEntry } from './entry';

export const runtimePlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/runtime',
  post: [
    '@modern-js/plugin-ssr',
    '@modern-js/plugin-state',
    '@modern-js/plugin-router',
    '@modern-js/plugin-document',
    '@modern-js/plugin-design-token',
  ],
  // the order of runtime plugins is affected by runtime hooks, mainly `init` and `hoc` hooks
  usePlugins: [ssrPlugin(), statePlugin(), routerPlugin(), documentPlugin()],
  setup: api => {
    return {
      checkEntryPoint({ path, entry }) {
        return { path, entry: entry || isRuntimeEntry(path) };
      },
      modifyEntrypoints({ entrypoints }) {
        const { internalDirectory } = api.useAppContext();
        const newEntryPoints = entrypoints.map(entrypoint => {
          if (entrypoint.isAutoMount) {
            entrypoint.internalEntry = path.resolve(
              internalDirectory,
              `./${entrypoint.entryName}/${ENTRY_POINT_FILE_NAME}`,
            );
          }
          return entrypoint;
        });
        return { entrypoints: newEntryPoints };
      },
      async generateEntryCode({ entrypoints }) {
        const appContext = api.useAppContext();
        const resolvedConfig = api.useResolvedConfigContext();
        const { mountId } = resolvedConfig.html;
        await generateCode(api, appContext, mountId);
        return { entrypoints };
      },
      /* Note that the execution time of the config hook is before prepare.
      /* This means that the entry information cannot be obtained in the config hook.
      /* Therefore, aliases cannot be set directly in the config.
      */
      prepare() {
        const { builder, entrypoints, internalDirectory, metaName } =
          api.useAppContext();
        builder?.addPlugins([
          pluginAlias({ entrypoints, internalDirectory, metaName }),
        ]);
      },
      config() {
        const appDir = api.useAppContext().appDirectory;
        process.env.IS_REACT18 = isReact18(appDir).toString();
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
        cleanRequireCache([
          require.resolve('../state/cli'),
          require.resolve('../router/cli'),
          require.resolve('../ssr/cli'),
        ]);
      },
    };
  },
});

export default runtimePlugin;
