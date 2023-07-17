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
      const { CHAIN_ID, isProd, target } = utils;
      const builderConfig = api.getNormalizedConfig();
      const { rootPath } = api.context;

      const swcConfig = await applyPluginConfig(
        options,
        target,
        isProd,
        builderConfig,
        rootPath,
      );

      // loader don't need keys like `presetEnv`, `presetReact`, etc
      const loaderOpt = removeUselessOptions(swcConfig);

      chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);
      chain.module.delete(CHAIN_ID.RULE.TS);
      const rule = chain.module.rule(CHAIN_ID.RULE.JS);

      // Insert swc loader and plugin
      rule
        .test(mergeRegex(JS_REGEX, TS_REGEX))
        .use(CHAIN_ID.USE.SWC)
        .loader(path.resolve(__dirname, './loader'))
        .options(loaderOpt);

      if (chain.module.rules.get(CHAIN_ID.RULE.JS_DATA_URI)) {
        chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .uses.delete(CHAIN_ID.USE.BABEL)
          .end()
          .use(CHAIN_ID.USE.SWC)
          .loader(path.resolve(__dirname, './loader'))
          .options(loaderOpt);
      }

      if (isDebugMode()) {
        const { CheckPolyfillPlugin } = await import('./checkPolyfillPlugin');

        chain
          .plugin(CHAIN_ID.PLUGIN.SWC_POLYFILL_CHECKER)
          .use(new CheckPolyfillPlugin(swcConfig));
      }

      if (checkUseMinify(swcConfig, builderConfig, isProd)) {
        // Insert swc minify plugin
        // @ts-expect-error webpack-chain missing minimizers type
        const minimizersChain = chain.optimization.minimizers;

        if (swcConfig.jsMinify !== false) {
          minimizersChain.delete(CHAIN_ID.MINIMIZER.JS).end();
        }

        if (swcConfig.cssMinify !== false) {
          minimizersChain.delete(CHAIN_ID.MINIMIZER.CSS).end();
        }

        minimizersChain
          .end()
          .minimizer(CHAIN_ID.MINIMIZER.SWC)
          .use(SwcMinimizerPlugin, [
            {
              jsMinify: swcConfig.jsMinify ?? swcConfig.jsc?.minify,
              cssMinify: swcConfig.cssMinify,
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
      target: 'es5',
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
    extensions: {
      lodash: {
        cwd,
        ids: ['lodash', 'lodash-es'],
      },
    },
  };
}

/**
 * @deprecated Using builderPluginSwc instead.
 */
export const PluginSwc = builderPluginSwc;
