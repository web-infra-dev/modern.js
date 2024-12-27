import path from 'path';
import type { AppTools, CliPluginFuture } from '@modern-js/app-tools';
import {
  isReact18 as checkIsReact18,
  cleanRequireCache,
  createRuntimeExportsUtils,
} from '@modern-js/utils';
import { documentPlugin } from '../document/cli';
import { routerPlugin } from '../router/cli';
import { statePlugin } from '../state/cli';
import { builderPluginAlias } from './alias';
import { generateCode } from './code';
import { ENTRY_BOOTSTRAP_FILE_NAME, ENTRY_POINT_FILE_NAME } from './constants';
import { isRuntimeEntry } from './entry';
import { ssrPlugin } from './ssr';

export { isRuntimeEntry } from './entry';
export { statePlugin, ssrPlugin, routerPlugin };
export const runtimePlugin = (params?: {
  plugins?: CliPluginFuture<AppTools<'shared'>>[];
}): CliPluginFuture<AppTools<'shared'>> => ({
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
    api.checkEntryPoint(({ path, entry }) => {
      return { path, entry: entry || isRuntimeEntry(path) };
    });

    api.modifyEntrypoints(({ entrypoints }) => {
      const { internalDirectory } = api.getAppContext();
      const {
        source: { enableAsyncEntry },
      } = api.getNormalizedConfig();
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
    });
    api.generateEntryCode(async ({ entrypoints }) => {
      const appContext = api.getAppContext();
      const resolvedConfig = api.getNormalizedConfig();
      const hooks = api.getHooks();
      await generateCode(entrypoints, appContext, resolvedConfig, hooks);
    });

    /* Note that the execution time of the config hook is before prepare.
    /* This means that the entry information cannot be obtained in the config hook.
    /* Therefore, aliases cannot be set directly in the config.
    */
    api.onPrepare(() => {
      const { builder, entrypoints, internalDirectory, metaName } =
        api.getAppContext();
      builder?.addPlugins([
        builderPluginAlias({ entrypoints, internalDirectory, metaName }),
      ]);
    });

    api.config(() => {
      const { appDirectory, metaName, internalDirectory } = api.getAppContext();

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
            '@meta/runtime/browser$': require.resolve(
              '@modern-js/runtime/browser',
            ),
            '@meta/runtime/react$': require.resolve('@modern-js/runtime/react'),
            '@meta/runtime/context$': require.resolve(
              '@modern-js/runtime/context',
            ),
            '@meta/runtime$': require.resolve('@modern-js/runtime'),
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
          bundlerChain: chain => {
            chain.module
              .rule('modern-entry')
              .test(/\.jsx?$/)
              .include.add(
                path.resolve(appDirectory, 'node_modules', `.${metaName}`),
              )
              .end()
              .sideEffects(true);
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
    });

    api.onBeforeRestart(() => {
      cleanRequireCache([
        require.resolve('../state/cli'),
        require.resolve('../router/cli'),
        require.resolve('./ssr'),
      ]);
    });
  },
});

export default runtimePlugin;
