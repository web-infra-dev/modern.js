import path from 'path';
import { CHAIN_ID, isProd, logger } from '@modern-js/utils';
import type { Compiler, Compilation } from 'webpack';
import type { JsMinifyOptions } from '@swc/core';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import {
  mergeRegex,
  JS_REGEX,
  TS_REGEX,
  getBrowserslistWithDefault,
} from '@modern-js/builder-shared';
import { merge } from '@modern-js/utils/lodash';
import { TransformConfig } from './config';
import { minify } from './binding';

const PLUGIN_NAME = 'builder-plugin-swc';

/**
 * In this plugin, we do:
 * - Remove Babel loader if exists
 * - Add our own swc loader
 */
export const PluginSwc = (userSwcConfig: Partial<TransformConfig> = {}) => ({
  name: PLUGIN_NAME,

  setup(api: BuilderPluginAPI) {
    // Find if babel & ts loader exists
    api.modifyWebpackChain(async (chain, { target }) => {
      logger.info(
        'You are using experimental SWC ability, babel-loader and ts-loader will be ignored.',
      );

      chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);
      chain.module.delete(CHAIN_ID.RULE.TS);

      const builderConfig = api.getNormalizedConfig();

      // eslint-disable-next-line no-multi-assign
      const swc = (userSwcConfig.swc = userSwcConfig.swc || {});
      swc.cwd = api.context.rootPath;

      if (!swc.env) {
        swc.env = {};
      }

      const { polyfill } = builderConfig.output;
      if (polyfill !== 'ua' && polyfill !== 'off') {
        swc.env.mode = polyfill;
      }

      if (!swc.env.targets) {
        swc.env.targets = await getBrowserslistWithDefault(
          api.context.rootPath,
          builderConfig,
          target,
        );
      }

      // eslint-disable-next-line no-multi-assign
      const extensions = (userSwcConfig.extensions =
        userSwcConfig.extensions || {});

      extensions.lockCorejsVersion = {
        corejs: path.dirname(require.resolve('core-js/package.json')),
        swcHelpers: path.dirname(require.resolve('@swc/helpers/package.json')),
      };

      // Insert swc loader and plugin
      chain.module
        .rule(CHAIN_ID.RULE.JS)
        .test(mergeRegex(JS_REGEX, TS_REGEX))
        .use(CHAIN_ID.USE.SWC)
        .loader(path.resolve(__dirname, './loader'))
        .options(userSwcConfig);

      if (chain.module.rules.get(CHAIN_ID.RULE.JS_DATA_URI)) {
        chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .uses.delete(CHAIN_ID.USE.BABEL)
          .end()
          .use(CHAIN_ID.USE.SWC)
          .loader(path.resolve(__dirname, './loader'))
          .options(userSwcConfig);
      }

      if (isProd() && !builderConfig.output.disableMinimize) {
        // Insert swc minify plugin
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error webpack-chain missing minimizers type
        chain.optimization.minimizers
          .delete(CHAIN_ID.MINIMIZER.JS)
          .end()
          .minimizer(CHAIN_ID.MINIMIZER.SWC)
          .use(SwcWebpackPlugin, [userSwcConfig]);
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
  private readonly minifyOptions: Partial<JsMinifyOptions>;

  constructor(options: Partial<TransformConfig> = {}) {
    this.minifyOptions = merge(
      defaultMinifyOptions,
      options.swc?.jsc?.minify || {},
    );
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
          this.minifyOptions,
          asset.name,
          source.toString(),
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
