import { getBabelConfigForWeb } from '@rsbuild/babel-preset/web';
import { getBabelConfigForNode } from '@rsbuild/babel-preset/node';
import type { BabelConfig } from '@rsbuild/babel-preset';
import {
  JS_REGEX,
  TS_REGEX,
  mergeRegex,
  getBrowserslistWithDefault,
  applyScriptCondition,
  getDefaultStyledComponentsConfig,
  addCoreJsEntry,
} from '@modern-js/builder-shared';
import { getCompiledPath } from '../shared';

import type {
  BuilderPlugin,
  NormalizedConfig,
  TransformImport,
} from '../types';
import {
  getBabelUtils,
  isUseSSRBundle,
  applyOptionsChain,
} from '@modern-js/utils';

export const getUseBuiltIns = (config: NormalizedConfig) => {
  const { polyfill } = config.output;
  if (polyfill === 'ua' || polyfill === 'off') {
    return false;
  }
  return polyfill;
};

export const builderPluginBabel = (): BuilderPlugin => ({
  name: 'builder-plugin-babel',
  setup(api) {
    api.modifyWebpackChain(
      async (
        chain,
        {
          CHAIN_ID,
          target,
          isProd,
          isServer,
          isServiceWorker,
          getCompiledPath,
        },
      ) => {
        const { lodash, applyOptionsChain } = await import('@modern-js/utils');

        const config = api.getNormalizedConfig();
        const browserslist = await getBrowserslistWithDefault(
          api.context.rootPath,
          config,
          target,
        );

        const getBabelOptions = (config: NormalizedConfig) => {
          // 1. Get styled-components options

          // 2. Create babel util function about include/exclude
          const includes: Array<string | RegExp> = [];
          const excludes: Array<string | RegExp> = [];

          const babelUtils = {
            addIncludes(items: string | RegExp | Array<string | RegExp>) {
              if (Array.isArray(items)) {
                includes.push(...items);
              } else {
                includes.push(items);
              }
            },
            addExcludes(items: string | RegExp | Array<string | RegExp>) {
              if (Array.isArray(items)) {
                excludes.push(...items);
              } else {
                excludes.push(items);
              }
            },
          };

          const decoratorConfig = {
            version: config.output.enableLatestDecorators
              ? '2018-09'
              : 'legacy',
          } as const;

          const baseBabelConfig =
            isServer || isServiceWorker
              ? getBabelConfigForNode({
                  presetEnv: {
                    targets: ['node >= 14'],
                  },
                  pluginDecorators: decoratorConfig,
                })
              : getBabelConfigForWeb({
                  presetEnv: {
                    targets: browserslist,
                    useBuiltIns: getUseBuiltIns(config),
                  },
                  pluginDecorators: decoratorConfig,
                });

          applyPluginImport(baseBabelConfig, config.source.transformImport);
          applyPluginLodash(
            baseBabelConfig,
            config.performance.transformLodash,
          );
          applyPluginStyledComponents(baseBabelConfig, config, isProd);

          const babelConfig = applyOptionsChain(
            baseBabelConfig,
            config.tools.babel,
            {
              ...getBabelUtils(baseBabelConfig),
              ...babelUtils,
            },
          );

          // 3. Compute final babel config
          const finalOptions: BabelConfig = {
            babelrc: false,
            configFile: false,
            compact: isProd,
            ...babelConfig,
          };

          if (config.output.charset === 'utf8') {
            finalOptions.generatorOpts = {
              jsescOption: { minimal: true },
            };
          }

          return {
            babelOptions: finalOptions,
            includes,
            excludes,
          };
        };

        const { babelOptions, includes, excludes } = getBabelOptions(config);
        const useTsLoader = Boolean(config.tools.tsLoader);
        const rule = chain.module.rule(CHAIN_ID.RULE.JS);

        applyScriptCondition({
          rule,
          config,
          context: api.context,
          includes,
          excludes,
        });

        rule
          .test(useTsLoader ? JS_REGEX : mergeRegex(JS_REGEX, TS_REGEX))
          .use(CHAIN_ID.USE.BABEL)
          .loader(getCompiledPath('babel-loader'))
          .options(babelOptions);

        /**
         * If a script is imported with data URI, it can be compiled by babel too.
         * This is used by some frameworks to create virtual entry.
         * https://webpack.js.org/api/module-methods/#import
         * @example: import x from 'data:text/javascript,export default 1;';
         */
        if (config.source.compileJsDataURI) {
          chain.module
            .rule(CHAIN_ID.RULE.JS_DATA_URI)
            .mimetype({
              or: ['text/javascript', 'application/javascript'],
            })
            .use(CHAIN_ID.USE.BABEL)
            .loader(getCompiledPath('babel-loader'))
            // Using cloned options to keep options separate from each other
            .options(lodash.cloneDeep(babelOptions));
        }

        addCoreJsEntry({ chain, config, isServer, isServiceWorker });
      },
    );
  },
});

function applyPluginLodash(config: BabelConfig, transformLodash?: boolean) {
  if (transformLodash) {
    config.plugins?.push([getCompiledPath('babel-plugin-lodash'), {}]);
  }
}

function applyPluginStyledComponents(
  babelConfig: BabelConfig,
  builderConfig: NormalizedConfig,
  isProd: boolean,
) {
  const styledComponentsOptions =
    builderConfig.tools.styledComponents !== false
      ? applyOptionsChain(
          getDefaultStyledComponentsConfig(
            isProd,
            isUseSSRBundle(builderConfig),
          ),
          builderConfig.tools.styledComponents,
        )
      : false;

  if (styledComponentsOptions) {
    babelConfig.plugins?.push([
      require.resolve('babel-plugin-styled-components'),
      styledComponentsOptions,
    ]);
  }
}

function applyPluginImport(
  config: BabelConfig,
  pluginImport?: false | TransformImport[],
) {
  if (pluginImport !== false && pluginImport) {
    for (const item of pluginImport) {
      const name = item.libraryName;

      const option: TransformImport & {
        camel2DashComponentName?: boolean;
      } = {
        ...item,
      };

      if (
        option.camelToDashComponentName !== undefined ||
        option.camel2DashComponentName !== undefined
      ) {
        option.camel2DashComponentName =
          option.camel2DashComponentName ?? option.camelToDashComponentName;
        delete option.camelToDashComponentName;
      }

      config.plugins?.push([
        require.resolve('babel-plugin-import'),
        option,
        name,
      ]);
    }
  }
}
