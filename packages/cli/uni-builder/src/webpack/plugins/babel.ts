import lodash from 'lodash';
import { getBabelConfigForWeb } from '@rsbuild/babel-preset/web';
import { getBabelConfigForNode } from '@rsbuild/babel-preset/node';
import type { BabelConfig } from '@rsbuild/babel-preset';
import { isBeyondReact17, applyOptionsChain } from '@modern-js/utils';
import {
  SCRIPT_REGEX,
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

/**
 * Plugin order:
 * rspack mode: rsbuild:swc -> rsbuild:babel
 * webpack mode: uni-builder:babel -> uni-builder:ts-loader -> rsbuild-webpack:swc
 */
export const getPresetReact = (rootPath: string, isProd: boolean) => {
  const isNewJsx = isBeyondReact17(rootPath);

  const presetReactOptions = {
    development: !isProd,
    // Will use the native built-in instead of trying to polyfill
    useBuiltIns: true,
    useSpread: false,
    runtime: isNewJsx ? 'automatic' : 'classic',
  };

  return [require.resolve('@babel/preset-react'), presetReactOptions];
};

export const pluginBabel = (
  options: PluginBabelOptions,
  extraOptions: {
    transformLodash: boolean;
  },
): RsbuildPlugin => ({
  name: 'uni-builder:babel',

  post: [
    // will replace the babel rule
    'rsbuild-webpack:swc',
    // will replace the babel rule
    'rsbuild-webpack:esbuild',
  ],

  setup(api) {
    api.modifyBundlerChain({
      order: 'pre',
      handler: async (
        chain,
        { CHAIN_ID, target, isProd, isServer, isServiceWorker },
      ) => {
        const config = api.getNormalizedConfig();
        const browserslist = await getBrowserslistWithDefault(
          api.context.rootPath,
          config,
          target,
        );

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

          const decoratorConfig = config.source.decorators;

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
          applyPluginLodash(baseBabelConfig, extraOptions.transformLodash);

          baseBabelConfig.presets?.push(
            getPresetReact(api.context.rootPath, isProd),
          );

          if (isProd) {
            baseBabelConfig.plugins?.push([
              require.resolve('babel-plugin-transform-react-remove-prop-types'),
              { removeImport: true },
            ]);
          }

          const babelConfig = applyOptionsChain(
            baseBabelConfig,
            options?.babelLoaderOptions,
            {
              ...getBabelUtils(baseBabelConfig),
              ...babelUtils,
            },
          );

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
          chain,
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
          // compatible with legacy packages with type="module"
          // https://github.com/webpack/webpack/issues/11467
          .resolve.set('fullySpecified', false)
          .end()
          .use(CHAIN_ID.USE.BABEL)
          .loader(require.resolve('babel-loader'))
          // Using cloned options to keep options separate from each other
          .options(lodash.cloneDeep(babelOptions));
      },
    });
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
