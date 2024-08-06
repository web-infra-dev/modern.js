import path from 'path';
import {
  isReact18 as checkIsReact18,
  cleanRequireCache,
  createRuntimeExportsUtils,
} from '@modern-js/utils';
import type { CliPlugin, AppTools } from '@modern-js/app-tools';
import { statePlugin } from '../state/cli';
import { routerPlugin } from '../router/cli';
import { documentPlugin } from '../document/cli';
import { ssrPlugin } from './ssr';
import { isRuntimeEntry } from './entry';
import { ENTRY_BOOTSTRAP_FILE_NAME, ENTRY_POINT_FILE_NAME } from './constants';
import { generateCode } from './code';
import { builderPluginAlias } from './alias';

export { isRuntimeEntry } from './entry';
export { statePlugin, ssrPlugin, routerPlugin, documentPlugin };
export const runtimePlugin = (params?: {
  plugins?: CliPlugin<AppTools>[];
}): CliPlugin<AppTools> => ({
  name: '@modern-js/runtime',
  post: [
    '@modern-js/plugin-ssr',
    '@modern-js/plugin-state',
    '@modern-js/plugin-router',
    '@modern-js/plugin-document',
    '@modern-js/plugin-design-token',
  ],
  // the order of runtime plugins is affected by runtime hooks, mainly `init` and `hoc` hooks
  usePlugins: params?.plugins || [
    ssrPlugin(),
    routerPlugin(),
    statePlugin(),
    documentPlugin(),
  ],
  setup: api => {
    return {
      checkEntryPoint({ path, entry }) {
        return { path, entry: entry || isRuntimeEntry(path) };
      },
      modifyEntrypoints({ entrypoints }) {
        const { internalDirectory } = api.useAppContext();
        const {
          source: { enableAsyncEntry },
        } = api.useResolvedConfigContext();
        const newEntryPoints = entrypoints.map(entrypoint => {
          if (entrypoint.isAutoMount) {
            entrypoint.internalEntry = path.resolve(
              internalDirectory,
              `./${entrypoint.entryName}/${
                enableAsyncEntry
                  ? ENTRY_BOOTSTRAP_FILE_NAME
                  : ENTRY_POINT_FILE_NAME
              }`,
            );
          }
          return entrypoint;
        });
        return { entrypoints: newEntryPoints };
      },
      async generateEntryCode({ entrypoints }) {
        const appContext = api.useAppContext();
        const resolvedConfig = api.useResolvedConfigContext();
        const runners = api.useHookRunners();
        await generateCode(
          entrypoints,
          appContext,
          resolvedConfig,
          runners._internalRuntimePlugins,
        );
      },
      /* Note that the execution time of the config hook is before prepare.
      /* This means that the entry information cannot be obtained in the config hook.
      /* Therefore, aliases cannot be set directly in the config.
      */
      prepare() {
        const { builder, entrypoints, internalDirectory, metaName } =
          api.useAppContext();
        builder?.addPlugins([
          builderPluginAlias({ entrypoints, internalDirectory, metaName }),
        ]);
      },
      config() {
        const { appDirectory, metaName, internalDirectory } =
          api.useAppContext();

        const isReact18 = checkIsReact18(appDirectory);

        process.env.IS_REACT18 = isReact18.toString();

        const pluginsExportsUtils = createRuntimeExportsUtils(
          internalDirectory,
          'plugins',
        );

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
              /**
               * Compatible with the reference path of the old version of the plugin.
               */
              [`@${metaName}/runtime/plugins`]: pluginsExportsUtils.getPath(),
              '@meta/runtime/browser': '@modern-js/runtime/browser',
              '@meta/runtime/react': '@modern-js/runtime/react',
              '@meta/runtime/context': '@modern-js/runtime/context',
              '@meta/runtime': '@modern-js/runtime',
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
            /**
             * Add IgnorePlugin to fix react-dom/client import error when use react17
             */
            webpackChain: (chain, { webpack }) => {
              if (!isReact18) {
                chain.plugin('ignore-plugin').use(webpack.IgnorePlugin, [
                  {
                    resourceRegExp: /^react-dom\/client$/,
                    contextRegExp: /./,
                  },
                ]);
              }
            },
            rspack: (_config, { appendPlugins, rspack }) => {
              if (!isReact18) {
                appendPlugins([
                  new rspack.IgnorePlugin({
                    resourceRegExp: /^react-dom\/client$/,
                    contextRegExp: /./,
                  }),
                ]);
              }
            },
          },
        };
      },
      async beforeRestart() {
        cleanRequireCache([
          require.resolve('../state/cli'),
          require.resolve('../router/cli'),
          require.resolve('./ssr'),
        ]);
      },
    };
  },
});

export default runtimePlugin;
