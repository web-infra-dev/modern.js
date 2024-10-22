import type { BabelConfig } from '@modern-js/babel-preset';
import { getBabelConfigForNode } from '@modern-js/babel-preset/node';
import { getBabelConfigForWeb } from '@modern-js/babel-preset/web';
import { applyOptionsChain, isBeyondReact17 } from '@modern-js/utils';
import { logger } from '@rsbuild/core';
import type {
  NormalizedEnvironmentConfig,
  NormalizedSourceConfig,
  RsbuildPlugin,
  TransformImport,
} from '@rsbuild/core';
import { type PluginBabelOptions, getBabelUtils } from '@rsbuild/plugin-babel';
import lodash from 'lodash';
import {
  SCRIPT_REGEX,
  SERVICE_WORKER_ENVIRONMENT_NAME,
  castArray,
  getBrowserslistWithDefault,
  getUseBuiltIns,
} from '../../shared/utils';

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
        { CHAIN_ID, target, isProd, isServer, environment },
      ) => {
        const { config, name } = environment;
        const browserslist = await getBrowserslistWithDefault(
          api.context.rootPath,
          config,
          target,
        );

        const getBabelOptions = (config: NormalizedEnvironmentConfig) => {
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
            isServer || name === SERVICE_WORKER_ENVIRONMENT_NAME
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

          applyPluginLodash(
            baseBabelConfig,
            extraOptions.transformLodash,
            config.source.transformImport,
          );
          applyPluginImport(baseBabelConfig, config.source.transformImport);

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

        for (const condition of includes) {
          rule.include.add(condition);
        }

        for (const condition of excludes) {
          rule.exclude.add(condition);
        }

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

function applyPluginLodash(
  config: BabelConfig,
  transformLodash?: boolean,
  transformImport: NormalizedSourceConfig['transformImport'] = [],
) {
  const finalTransformImport = reduceTransformImportConfig(transformImport);
  const hasImportPluginForLodash = finalTransformImport.some(
    transformImport => {
      return transformImport.libraryName === 'lodash';
    },
  );
  if (hasImportPluginForLodash && transformLodash) {
    logger.warn(
      'Detected a potential conflict between `source.transformImport` and `performance.transformLodash` for lodash. ' +
        'Please ensure only one of these configurations is used to handle lodash imports. ' +
        'If you want to use `source.transformImport`, set `performance.transformLodash` to `false` in your configuration.',
    );
  }
  if (transformLodash) {
    config.plugins?.push([
      require.resolve('../../../compiled/babel-plugin-lodash'),
      {},
    ]);
  }
}

const reduceTransformImportConfig = (
  options: NormalizedSourceConfig['transformImport'],
): TransformImport[] => {
  if (!options) {
    return [];
  }

  let imports: TransformImport[] = [];
  for (const item of castArray(options)) {
    if (typeof item === 'function') {
      imports = item(imports) ?? imports;
    } else {
      imports.push(item);
    }
  }
  return imports;
};

function applyPluginImport(
  config: BabelConfig,
  pluginImport?: NormalizedSourceConfig['transformImport'],
) {
  const finalPluginImport = reduceTransformImportConfig(pluginImport);

  if (finalPluginImport?.length) {
    for (const item of finalPluginImport) {
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
