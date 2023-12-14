import lodash from 'lodash';
import { getBabelConfigForWeb } from '@rsbuild/babel-preset/web';
import { getBabelConfigForNode } from '@rsbuild/babel-preset/node';
import type { BabelConfig } from '@rsbuild/babel-preset';
import { isBeyondReact17 } from '@rsbuild/plugin-react';
import {
  SCRIPT_REGEX,
  addCoreJsEntry,
  mergeChainedOptions,
  applyScriptCondition,
  getBrowserslistWithDefault,
  type RsbuildPlugin,
  type TransformImport,
  type NormalizedConfig,
} from '@rsbuild/shared';
import {
  getBabelUtils,
  getUseBuiltIns,
  type PluginBabelOptions,
} from '@rsbuild/plugin-babel';

export const pluginBabel = (options?: PluginBabelOptions): RsbuildPlugin => ({
  name: 'uni-builder:babel',
  setup(api) {
    api.modifyBundlerChain(
      async (
        chain,
        { CHAIN_ID, target, isProd, isServer, isServiceWorker },
      ) => {
        const config = api.getNormalizedConfig();
        const browserslist = await getBrowserslistWithDefault(
          api.context.rootPath,
          config,
          target,
        );
        const isNewJsx = await isBeyondReact17(api.context.rootPath);

        const getBabelOptions = (config: NormalizedConfig) => {
          // Create babel util function about include/exclude
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

          const presetReactOptions = {
            development: !isProd,
            // Will use the native built-in instead of trying to polyfill
            useBuiltIns: true,
            useSpread: false,
            runtime: isNewJsx ? 'automatic' : 'classic',
          };

          baseBabelConfig.presets?.push([
            require.resolve('@babel/preset-react'),
            presetReactOptions,
          ]);

          if (isProd) {
            baseBabelConfig.plugins?.push([
              require.resolve('babel-plugin-transform-react-remove-prop-types'),
              { removeImport: true },
            ]);
          }

          const babelConfig = mergeChainedOptions({
            defaults: baseBabelConfig,
            options: options?.babelLoaderOptions,
            utils: {
              ...getBabelUtils(baseBabelConfig),
              ...babelUtils,
            },
          });

          // Compute final babel config
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
        const rule = chain.module.rule(CHAIN_ID.RULE.JS);

        applyScriptCondition({
          rule,
          config,
          context: api.context,
          includes,
          excludes,
        });

        rule
          .test(SCRIPT_REGEX)
          .use(CHAIN_ID.USE.BABEL)
          .loader(require.resolve('babel-loader'))
          .options(babelOptions);

        /**
         * If a script is imported with data URI, it can be compiled by babel too.
         * This is used by some higher-level solutions to create virtual entry.
         * https://webpack.js.org/api/module-methods/#import
         * @example: import x from 'data:text/javascript,export default 1;';
         */
        chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .mimetype({
            or: ['text/javascript', 'application/javascript'],
          })
          .use(CHAIN_ID.USE.BABEL)
          .loader(require.resolve('babel-loader'))
          // Using cloned options to keep options separate from each other
          .options(lodash.cloneDeep(babelOptions));

        addCoreJsEntry({ chain, config, isServer, isServiceWorker });
      },
    );
  },
});

function applyPluginLodash(config: BabelConfig, transformLodash?: boolean) {
  if (transformLodash) {
    config.plugins?.push([
      require.resolve('../../../compiled/babel-plugin-lodash'),
      {},
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
