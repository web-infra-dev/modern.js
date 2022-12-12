import path from 'path';
import type { Compiler, Compilation } from 'webpack';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import {
  mergeRegex,
  JS_REGEX,
  TS_REGEX,
  BuilderPlugin,
  getBrowserslistWithDefault,
} from '@modern-js/builder-shared';
import { merge } from '@modern-js/utils/lodash';
import { CORE_JS_PATH, getCoreJsVersion } from '@modern-js/utils';
import { JsMinifyOptions } from '@modern-js/swc-plugins';
import { minify } from './binding';
import { PluginSwcOptions, TransformConfig } from './config';

const PLUGIN_NAME = 'builder-plugin-swc';

/**
 * In this plugin, we do:
 * - Remove Babel loader if exists
 * - Add our own swc loader
 */
export const PluginSwc = (
  pluginConfig: PluginSwcOptions = {},
): BuilderPlugin => ({
  name: PLUGIN_NAME,

  setup(api: BuilderPluginAPI) {
    const SWC_HELPERS_PATH = require.resolve('@swc/helpers/package.json');

    // Find if babel & ts loader exists
    api.modifyWebpackChain(async (chain, { target, CHAIN_ID }) => {
      const { isProd } = await import('@modern-js/utils');

      chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);
      chain.module.delete(CHAIN_ID.RULE.TS);

      const builderConfig = api.getNormalizedConfig();

      const swc: TransformConfig = {
        jsc: { transform: {} },
        env: pluginConfig.presetEnv || {},
        extensions: {},
        cwd: api.context.rootPath,
      };

      if (pluginConfig.presetReact) {
        swc.jsc!.transform!.react = pluginConfig.presetReact;
      }

      const { polyfill } = builderConfig.output;
      if (
        swc.env!.mode === undefined &&
        polyfill !== 'ua' &&
        polyfill !== 'off'
      ) {
        swc.env!.mode = polyfill;
      }

      // If `targets` is not specified manually, we get `browserslist` from project.
      if (!swc.env!.coreJs) {
        swc.env!.coreJs = getCoreJsVersion();
      }

      // If `targets` is not specified manually, we get `browserslist` from project.
      if (!swc.env!.targets) {
        swc.env!.targets = await getBrowserslistWithDefault(
          api.context.rootPath,
          builderConfig,
          target,
        );
      }

      const { extensions } = swc;

      extensions!.lockCorejsVersion = {
        corejs: path.dirname(CORE_JS_PATH),
        swcHelpers: path.dirname(SWC_HELPERS_PATH),
      };

      const rule = chain.module.rule(CHAIN_ID.RULE.JS);
      // Insert swc loader and plugin
      rule
        .test(mergeRegex(JS_REGEX, TS_REGEX))
        .use(CHAIN_ID.USE.SWC)
        .loader(path.resolve(__dirname, './loader'))
        .options(swc);

      if (chain.module.rules.get(CHAIN_ID.RULE.JS_DATA_URI)) {
        chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .uses.delete(CHAIN_ID.USE.BABEL)
          .end()
          .use(CHAIN_ID.USE.SWC)
          .loader(path.resolve(__dirname, './loader'))
          .options(swc);
      }

      if (
        isProd() &&
        !builderConfig.output.disableMinimize &&
        pluginConfig.jsMinify !== false
      ) {
        // Insert swc minify plugin
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error webpack-chain missing minimizers type
        chain.optimization.minimizers
          .delete(CHAIN_ID.MINIMIZER.JS)
          .end()
          .minimizer(CHAIN_ID.MINIMIZER.SWC)
          .use(SwcWebpackPlugin, [
            pluginConfig.jsMinify === true ? {} : pluginConfig.jsMinify,
          ]);
      }
    });
  },
});

export interface Output {
  code: string;
  map?: string;
}

const defaultMinifyOptions: JsMinifyOptions = {
  compress: {},
  mangle: true,
};

const JS_RE = /\.js$/;
export class SwcWebpackPlugin {
  private readonly minifyOptions: JsMinifyOptions;

  constructor(options: JsMinifyOptions = {}) {
    this.minifyOptions = merge(defaultMinifyOptions, options);
  }

  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(PLUGIN_NAME, async compilation => {
      const { Compilation } = compiler.webpack;
      const { devtool } = compilation.options;

      this.minifyOptions.sourceMap =
        typeof devtool === 'string'
          ? devtool.includes('source-map')
          : Boolean(devtool);
      this.minifyOptions.inlineSourcesContent =
        typeof devtool === 'string' && devtool.includes('inline');

      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        },
        async () => {
          await this.updateAssets(compilation);
        },
      );
    });
  }

  async updateAssets(compilation: Compilation): Promise<void[]> {
    const { SourceMapSource, RawSource } = compilation.compiler.webpack.sources;
    const assets = compilation
      .getAssets()
      // TODO handle css minify
      .filter(asset => !asset.info.minimized && JS_RE.test(asset.name));

    return Promise.all(
      assets.map(async asset => {
        const { source, map } = asset.source.sourceAndMap();
        const result = await minify(
          asset.name,
          source.toString(),
          this.minifyOptions,
        );

        compilation.updateAsset(
          asset.name,
          this.minifyOptions.sourceMap && result.map
            ? new SourceMapSource(
                result.code,
                asset.name,
                result.map,
                source.toString(),
                map,
                true,
              )
            : new RawSource(result?.code || ''),
        );
      }),
    );
  }
}
