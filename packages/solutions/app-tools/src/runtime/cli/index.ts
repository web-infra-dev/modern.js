import path from 'path';
import {
  isReact18 as checkIsReact18,
  cleanRequireCache,
  createRuntimeExportsUtils,
} from '@modern-js/utils';
import type { AppTools, CliPluginFuture } from '../../types';
import { documentPlugin } from '../document/cli';
import { routerPlugin } from '../router/cli';
import { builderPluginAlias } from './alias';
import { generateCode } from './code';
import { ENTRY_BOOTSTRAP_FILE_NAME, ENTRY_POINT_FILE_NAME } from './constants';
import { isRuntimeEntry } from './entry';
import { ssrPlugin } from './ssr';

export { isRuntimeEntry } from './entry';
export { ssrPlugin, routerPlugin, documentPlugin };
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
    documentPlugin(),
  ],
  setup: api => {
    const userConfig = api.getConfig();
    const isEnableRuntime = !!userConfig.runtime;
    if (!isEnableRuntime) {
      return;
    }
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
            '@meta/runtime/browser$': `@${metaName}/app-tools/browser`,
            '@meta/runtime/react$': `@${metaName}/app-tools/react`,
            '@meta/runtime/context$': `@${metaName}/app-tools/runtime/context`,
            '@meta/runtime$': `@${metaName}/app-tools/runtime`,
            /**
             * Compatible with the reference path of the old version of the plugin.
             */
            [`@${metaName}/runtime/plugins`]: pluginsExportsUtils.getPath(),
            [`@${metaName}/runtime/browser$`]: `@${metaName}/app-tools/runtime/browser`,
            [`@${metaName}/runtime/react$`]: `@${metaName}/app-tools/runtime/react`,
            [`@${metaName}/runtime/context$`]: `@${metaName}/app-tools/runtime/context`,
            [`@${metaName}/runtime$`]: `@${metaName}/app-tools/runtime`,
            [`@${metaName}/runtime/plugin$`]: `@${metaName}/app-tools/runtime/plugin`,
            [`@${metaName}/runtime/loadable$`]: `@${metaName}/app-tools/runtime/loadable`,
            [`@${metaName}/runtime/head$`]: `@${metaName}/app-tools/runtime/head`,
            [`@${metaName}/runtime/styled$`]: `@${metaName}/app-tools/runtime/styled`,
            [`@${metaName}/runtime/server`]: `@${metaName}/app-tools/runtime/server`,
            [`@${metaName}/runtime/ssr$`]: `@${metaName}/app-tools/runtime/ssr`,
            [`@${metaName}/runtime/ssr/server$`]: `@${metaName}/app-tools/runtime/ssr/server`,
            [`@${metaName}/runtime/document$`]: `@${metaName}/app-tools/runtime/document`,
            [`@${metaName}/runtime/cli$`]: `@${metaName}/app-tools/runtime/cli`,
            [`@${metaName}/runtime/router$`]: `@${metaName}/app-tools/runtime/router`,
            [`@${metaName}/runtime/router/server$`]: `@${metaName}/app-tools/runtime/router/server`,
            [`@${metaName}/runtime/loadable-bundler-plugin$`]: `@${metaName}/app-tools/runtime/loadable-bundler-plugin`,
            [`@${metaName}/runtime/rsc/server$`]: `@${metaName}/app-tools/runtime/rsc/server`,
            [`@${metaName}/runtime/rsc/client$`]: `@${metaName}/app-tools/runtime/rsc/client`,
            [`@${metaName}/runtime/cache$`]: `@${metaName}/app-tools/runtime/cache`,
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
                path.resolve(appDirectory, 'node_modules', `.$metaName`),
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
        require.resolve('../router/cli'),
        require.resolve('./ssr'),
      ]);
    });
  },
});

export default runtimePlugin;
