import * as path from 'path';
import type {
  BuilderPluginAPI,
  BuilderPlugin,
} from '@modern-js/builder-webpack-provider';
import {
  JS_REGEX,
  TS_REGEX,
  getBrowserslistWithDefault,
  getDefaultStyledComponentsConfig,
  isUsingHMR,
  mergeRegex,
} from '@modern-js/builder-shared';
import { applyOptionsChain, getCoreJsVersion, logger } from '@modern-js/utils';
import { merge } from '@modern-js/utils/lodash';
import { PluginSwcOptions, TransformConfig } from './types';
import { checkUseMinify, determinePresetReact, isDebugMode } from './utils';
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
  pluginOptions: PluginSwcOptions = {},
): BuilderPlugin => ({
  name: PLUGIN_NAME,

  setup(api: BuilderPluginAPI) {
    api.modifyBuilderConfig(config => {
      const extensions: PluginSwcOptions['extensions'] =
        // eslint-disable-next-line no-multi-assign
        (pluginOptions.extensions ??= {});

      if (config.source?.transformImport) {
        extensions.pluginImport ??= [];
        extensions.pluginImport.push(...config.source.transformImport);
      }
    });

    api.modifyWebpackChain(async (chain, utils) => {
      const { target, CHAIN_ID, isProd } = utils;
      const config = api.getNormalizedConfig();
      const { rootPath } = api.context;

      chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);
      chain.module.delete(CHAIN_ID.RULE.TS);

      const builderConfig = api.getNormalizedConfig();

      determinePresetReact(rootPath, pluginOptions);
      const swc = {
        jsc: {
          transform: {
            react: {
              refresh: isUsingHMR(config, utils),
            },
          },
        },
        env: pluginOptions.presetEnv || {},
        extensions: { ...pluginOptions.extensions },
        cwd: rootPath,
      } satisfies TransformConfig;

      if (pluginOptions.presetReact) {
        swc.jsc.transform.react = {
          ...swc.jsc.transform.react,
          ...pluginOptions.presetReact,
        };
      }

      const { polyfill } = builderConfig.output;
      if (
        swc.env.mode === undefined &&
        polyfill !== 'ua' &&
        polyfill !== 'off'
      ) {
        swc.env.mode = polyfill;
      }

      if (!swc.env.coreJs) {
        const CORE_JS_PATH = require.resolve('core-js/package.json');
        swc.env.coreJs = getCoreJsVersion(CORE_JS_PATH);
      }

      // If `targets` is not specified manually, we get `browserslist` from project.
      if (!swc.env.targets) {
        swc.env.targets = await getBrowserslistWithDefault(
          api.context.rootPath,
          builderConfig,
          target,
        );
      }

      const isSSR = utils.target === 'node';

      if (
        config.tools.styledComponents !== false &&
        swc.extensions?.styledComponents !== false
      ) {
        const styledComponentsOptions = applyOptionsChain(
          getDefaultStyledComponentsConfig(isProd, isSSR),
          config.tools.styledComponents,
        );
        swc.extensions.styledComponents = {
          ...styledComponentsOptions,
          ...(typeof swc.extensions.styledComponents === 'object'
            ? swc.extensions?.styledComponents
            : {}),
        };
      }

      /**
       * SWC can't use latestDecorator in TypeScript file for now
       */
      if (builderConfig.output.enableLatestDecorators) {
        logger.warn('Cannot use latestDecorator in SWC compiler.');
      }

      const rule = chain.module.rule(CHAIN_ID.RULE.JS);

      // apply swc default config
      const swcConfig: Required<TransformConfig> = merge(
        getDefaultSwcConfig(),
        swc,
      ) as unknown as Required<TransformConfig>;

      // Insert swc loader and plugin
      rule
        .test(mergeRegex(JS_REGEX, TS_REGEX))
        .use(CHAIN_ID.USE.SWC)
        .loader(path.resolve(__dirname, './loader'))
        .options(swcConfig);

      if (chain.module.rules.get(CHAIN_ID.RULE.JS_DATA_URI)) {
        chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .uses.delete(CHAIN_ID.USE.BABEL)
          .end()
          .use(CHAIN_ID.USE.SWC)
          .loader(path.resolve(__dirname, './loader'))
          .options(swcConfig);
      }

      if (isDebugMode()) {
        const { CheckPolyfillPlugin } = await import('./checkPolyfillPlugin');

        chain
          .plugin(CHAIN_ID.PLUGIN.SWC_POLYFILL_CHECKER)
          .use(new CheckPolyfillPlugin(swcConfig));
      }

      if (checkUseMinify(pluginOptions, builderConfig, isProd)) {
        // Insert swc minify plugin
        // @ts-expect-error webpack-chain missing minimizers type
        const minimizersChain = chain.optimization.minimizers;

        if (pluginOptions.jsMinify !== false) {
          minimizersChain.delete(CHAIN_ID.MINIMIZER.JS).end();
        }

        if (pluginOptions.cssMinify !== false) {
          minimizersChain.delete(CHAIN_ID.MINIMIZER.CSS).end();
        }

        minimizersChain
          .end()
          .minimizer(CHAIN_ID.MINIMIZER.SWC)
          .use(SwcMinimizerPlugin, [
            {
              jsMinify: pluginOptions.jsMinify,
              cssMinify: pluginOptions.cssMinify,
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
