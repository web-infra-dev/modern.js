import path from 'path';
import {
  getEntryOptions,
  createRuntimeExportsUtils,
  PLUGIN_SCHEMAS,
} from '@modern-js/utils';
import { ServerRoute } from '@modern-js/types';
import type { CliPlugin } from '@modern-js/core';
import prepareConfigRoutes, {
  INNER_CONFIG_ROUTES_FILENAME,
} from './prepareConfigRoutes';

const PLUGIN_IDENTIFIER = 'router';

const ROUTES_IDENTIFIER = 'routes';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-router',
  required: ['@modern-js/runtime'],
  setup: api => {
    const runtimeConfigMap = new Map<string, any>();

    let pluginsExportsUtils: any;

    return {
      config() {
        const appContext = api.useAppContext();

        pluginsExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'plugins',
        );

        return {
          source: {
            alias: {
              '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
            },
          },

          tools: {
            webpackChain: (chain, { CHAIN_ID }) => {
              const userConfig = api.useResolvedConfigContext();
              const { lazy, loading } = userConfig?.runtime?.router;

              const babel = chain.module
                .rule(CHAIN_ID.RULE.LOADERS)
                .oneOf(CHAIN_ID.ONE_OF.JS)
                .use(CHAIN_ID.USE.BABEL);

              const options = babel.get('options');
              const babelLoader = babel.get('loader');

              chain.module
                .rule('config-routes')
                .oneOf(CHAIN_ID.ONE_OF.JS)
                .test(new RegExp(`${INNER_CONFIG_ROUTES_FILENAME}`))
                .include.add(
                  new RegExp(`node_modules/.${appContext.metaName}/*`),
                )
                .end()
                .use(CHAIN_ID.USE.BABEL)
                .loader(babelLoader)
                .options({
                  ...options,
                  plugins: [
                    ...options.plugins,
                    [
                      path.resolve(__dirname, 'babel-plugin-config-routes.js'),
                      { lazy },
                    ],
                  ],
                })
                .end()
                .use('config-routes-loader')
                .loader(path.resolve(__dirname, 'config-routes-loader.js'))
                .options({
                  lazy,
                  loading,
                })
                .before(CHAIN_ID.USE.BABEL);

              return chain;
            },
          },
        };
      },
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-router'];
      },
      async modifyEntryImports({ entrypoint, imports }: any) {
        const { entryName, configRoutes } = entrypoint;
        const userConfig = api.useResolvedConfigContext();
        const isLegacy = Boolean(userConfig?.runtime?.router?.legacy);
        const { packageName, internalDirectory } = api.useAppContext();

        if (configRoutes) {
          await prepareConfigRoutes(configRoutes, internalDirectory, entryName);
        }

        const runtimeConfig = getEntryOptions(
          entryName,
          userConfig.runtime,
          userConfig.runtimeByEntries,
          packageName,
        );

        runtimeConfigMap.set(entryName, runtimeConfig);

        if (runtimeConfig?.router) {
          if (!isLegacy) {
            imports.push({
              value: '@modern-js/runtime/plugins',
              specifiers: [{ imported: PLUGIN_IDENTIFIER }],
            });
            if (configRoutes) {
              imports.push({
                value: `./${INNER_CONFIG_ROUTES_FILENAME}`,
                specifiers: [
                  { local: ROUTES_IDENTIFIER },
                  { imported: 'LoadingComponent' },
                  { imported: 'lazy' },
                ],
              });
            }
          }
        } else {
          throw new Error(
            `should enable runtime.router for entry ${entryName}`,
          );
        }

        return {
          entrypoint,
          imports,
        };
      },
      modifyEntryRuntimePlugins({ entrypoint, plugins }: any) {
        const { entryName, fileSystemRoutes, configRoutes } = entrypoint;
        const { serverRoutes } = api.useAppContext();
        const userConfig = api.useResolvedConfigContext();
        const isLegacy = Boolean(userConfig?.runtime?.router?.legacy);
        const runtimeConfig = runtimeConfigMap.get(entryName);
        if (runtimeConfig.router && !isLegacy) {
          // Todo: plugin-router best to only handle manage client route.
          // here support base server route usage, part for compatibility
          const serverBase = serverRoutes
            .filter((route: ServerRoute) => route.entryName === entryName)
            .map(route => route.urlPath)
            .sort((a, b) => (a.length - b.length > 0 ? -1 : 1));

          plugins.push({
            name: PLUGIN_IDENTIFIER,
            options: JSON.stringify({
              serverBase,
              ...runtimeConfig.router,
              routesConfig: fileSystemRoutes
                ? `{ ${ROUTES_IDENTIFIER}, globalApp: App }`
                : undefined,
              configRoutes: configRoutes
                ? {
                    routes: `${ROUTES_IDENTIFIER}`,
                    LoadingComponent: 'LoadingComponent',
                    lazy: 'lazy',
                  }
                : undefined,
            })
              .replace(
                /"routesConfig"\s*:\s*"((\S|\s)+)"/g,
                '"routesConfig": $1,',
              )
              .replace(
                '"routes":"routes","LoadingComponent":"LoadingComponent","lazy":"lazy"',
                'routes,LoadingComponent,lazy',
              ),
          });
        }
        return {
          entrypoint,
          plugins,
        };
      },
      addRuntimeExports() {
        const userConfig = api.useResolvedConfigContext();
        const isLegacy = Boolean(userConfig?.runtime?.router?.legacy);
        if (!isLegacy) {
          pluginsExportsUtils.addExport(
            `export { default as router } from '@modern-js/runtime/router'`,
          );
        }
      },
    };
  },
});
