import path from 'path';
import {
  getEntryOptions,
  SERVER_RENDER_FUNCTION_NAME,
  LOADABLE_STATS_FILE,
  isUseSSRBundle,
  createRuntimeExportsUtils,
  PLUGIN_SCHEMAS,
} from '@modern-js/utils';
import {
  createPlugin,
  useAppContext,
  useResolvedConfigContext,
} from '@modern-js/core';
import LoadableWebpackPlugin from '@loadable/webpack-plugin';
import type WebpackChain from 'webpack-chain';
import type { BabelChain } from '@modern-js/babel-chain';

const PLUGIN_IDENTIFIER = 'ssr';

export default createPlugin(
  (() => {
    const ssrConfigMap = new Map<string, any>();

    let pluginsExportsUtils: any;
    const ssrModulePath = path.resolve(__dirname, '../../../../');

    return {
      config() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const appContext = useAppContext();

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
            webpack: (config: any, { chain }: { chain: WebpackChain }) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const userConfig = useResolvedConfigContext();
              if (isUseSSRBundle(userConfig) && config.name !== 'server') {
                chain
                  .plugin('loadable')
                  .use(LoadableWebpackPlugin, [
                    { filename: LOADABLE_STATS_FILE },
                  ]);
              }
            },
            babel: (config: any, { chain }: { chain: BabelChain }) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const userConfig = useResolvedConfigContext();
              if (isUseSSRBundle(userConfig)) {
                chain
                  ?.plugin('loadable')
                  .use(require.resolve('@loadable/babel-plugin'));
              }
            },
          },
        };
      },
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-ssr'];
      },
      modifyEntryImports({ entrypoint, imports }: any) {
        const { entryName } = entrypoint;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const userConfig = useResolvedConfigContext();

        pluginsExportsUtils.addExport(
          `export { default as ssr } from '${ssrModulePath}'`,
        );

        const ssrConfig = getEntryOptions(
          entryName,
          userConfig.server.ssr || Boolean((userConfig.output as any).ssg),
          userConfig.server.ssrByEntries,
        );

        ssrConfigMap.set(entryName, ssrConfig);

        if (ssrConfig) {
          imports.push({
            value: '@modern-js/runtime/plugins',
            specifiers: [{ imported: PLUGIN_IDENTIFIER }],
          });
        }
        return {
          entrypoint,
          imports,
        };
      },
      modifyEntryRuntimePlugins({ entrypoint, plugins }: any) {
        if (ssrConfigMap.get(entrypoint.entryName)) {
          plugins.push({
            name: PLUGIN_IDENTIFIER,
            options: ssrConfigMap.get(entrypoint.entryName),
          });
        }
        return {
          entrypoint,
          plugins,
        };
      },
      modifyEntryExport({ entrypoint, exportStatement }: any) {
        if (ssrConfigMap.get(entrypoint.entryName)) {
          return {
            entrypoint,
            exportStatement: [
              `export function ${SERVER_RENDER_FUNCTION_NAME}(context) {
              return bootstrap(AppWrapper, context)
            }`,
              exportStatement,
            ].join('\n'),
          };
        }
        return { entrypoint, exportStatement };
      },
    };
  }) as any,
  {
    name: '@modern-js/plugin-ssr',
    required: ['@modern-js/runtime'],
  },
);
