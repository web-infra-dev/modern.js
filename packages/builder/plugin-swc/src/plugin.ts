import * as path from 'path';
import type {
  BuilderPluginAPI,
  BuilderPlugin,
} from '@modern-js/builder-webpack-provider';
import { JS_REGEX, TS_REGEX, mergeRegex } from '@modern-js/builder-shared';
import type { PluginSwcOptions, TransformConfig } from './types';
import {
  applyPluginConfig,
  checkUseMinify,
  isDebugMode,
  removeUselessOptions,
} from './utils';
import { SwcMinimizerPlugin } from './minizer';

const PLUGIN_NAME = 'builder-plugin-swc';

/**
 * In this plugin, we do:
 * - Remove Babel loader if exists
 * - Add our own swc loader
 * - Remove JS minifier
 * - Add swc minifier plugin
 */
export const builderPluginSwc = (
  options: PluginSwcOptions = {},
): BuilderPlugin => ({
  name: PLUGIN_NAME,

  setup(api: BuilderPluginAPI) {
    if (api.context.bundlerType === 'rspack') {
      return;
    }

    api.modifyWebpackChain(async (chain, utils) => {
      const { CHAIN_ID, isProd } = utils;
      const builderConfig = api.getNormalizedConfig();
      const { rootPath } = api.context;

      const swcConfigs = await applyPluginConfig(
        options,
        utils,
        builderConfig,
        rootPath,
      );

      chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);
      chain.module.delete(CHAIN_ID.RULE.TS);

      const TJS_REGEX = mergeRegex(JS_REGEX, TS_REGEX);
      for (let i = 0; i < swcConfigs.length; i++) {
        const { test, include, exclude, swcConfig } = swcConfigs[i];

        const ruleId =
          i > 0 ? CHAIN_ID.RULE.JS + i.toString() : CHAIN_ID.RULE.JS;
        const rule = chain.module.rule(ruleId);

        // Insert swc loader and plugin
        rule
          .test(test || TJS_REGEX)
          .use(CHAIN_ID.USE.SWC)
          .loader(path.resolve(__dirname, './loader'))
          .options(removeUselessOptions(swcConfig) satisfies TransformConfig);

        if (include) {
          for (const extra of include) {
            rule.include.add(extra);
          }
        }

        if (exclude) {
          for (const extra of exclude) {
            rule.exclude.add(extra);
          }
        }
      }

      // first config is the main config
      const mainConfig = swcConfigs[0].swcConfig;

      if (chain.module.rules.get(CHAIN_ID.RULE.JS_DATA_URI)) {
        chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .uses.delete(CHAIN_ID.USE.BABEL)
          .end()
          .use(CHAIN_ID.USE.SWC)
          .loader(path.resolve(__dirname, './loader'))
          .options(removeUselessOptions(mainConfig) satisfies TransformConfig);
      }

      if (isDebugMode()) {
        const { CheckPolyfillPlugin } = await import('./checkPolyfillPlugin');

        chain
          .plugin(CHAIN_ID.PLUGIN.SWC_POLYFILL_CHECKER)
          .use(new CheckPolyfillPlugin(mainConfig));
      }

      if (checkUseMinify(mainConfig, builderConfig, isProd)) {
        // Insert swc minify plugin
        // @ts-expect-error webpack-chain missing minimizers type
        const minimizersChain = chain.optimization.minimizers;

        if (mainConfig.jsMinify !== false) {
          minimizersChain.delete(CHAIN_ID.MINIMIZER.JS).end();
        }

        if (mainConfig.cssMinify !== false) {
          minimizersChain.delete(CHAIN_ID.MINIMIZER.CSS).end();
        }

        minimizersChain
          .end()
          .minimizer(CHAIN_ID.MINIMIZER.SWC)
          .use(SwcMinimizerPlugin, [
            {
              jsMinify: mainConfig.jsMinify ?? mainConfig.jsc?.minify,
              cssMinify: mainConfig.cssMinify,
              builderConfig,
            },
          ]);
      }
    });
  },
});

/// default swc configuration
export function getDefaultSwcConfig(): TransformConfig {
  const cwd = process.cwd();
  return {
    cwd,
    jsc: {
      externalHelpers: true,
      parser: {
        tsx: true,
        syntax: 'typescript',
        decorators: true,
      },
      transform: {
        react: {
          runtime: 'automatic',
        },
      },
      // Avoid the webpack magic comment to be removed
      // https://github.com/swc-project/swc/issues/6403
      preserveAllComments: true,
    },
    minify: false, // for loader, we don't need to minify, we do minification using plugin
    sourceMaps: true,
    env: {
      targets: '> 0.01%, not dead, not op_mini all',
    },
    exclude: [],
    inlineSourcesContent: true,
  };
}

/**
 * @deprecated Using builderPluginSwc instead.
 */
export const PluginSwc = builderPluginSwc;
