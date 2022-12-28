import path from 'path';
import assert from 'assert';
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
import { getCoreJsVersion, readTsConfig } from '@modern-js/utils';
import { JsMinifyOptions } from '@modern-js/swc-plugins';
import { minify } from './binding';
import { PluginSwcOptions, TransformConfig } from './config';

const PLUGIN_NAME = 'builder-plugin-swc';
const BUILDER_SWC_DEBUG_MODE = 'BUILDER_SWC_DEBUG_MODE';

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
    const CORE_JS_PATH = require.resolve('core-js/package.json');
    const SWC_HELPERS_PATH = require.resolve('@swc/helpers/package.json');

    // Find if babel & ts loader exists
    api.modifyWebpackChain(async (chain, { target, CHAIN_ID }) => {
      const { isProd } = await import('@modern-js/utils');
      const { rootPath } = api.context;

      chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);
      chain.module.delete(CHAIN_ID.RULE.TS);

      const builderConfig = api.getNormalizedConfig();
      determinePresetReact(rootPath, pluginConfig);

      const swc: TransformConfig = {
        jsc: { transform: {} },
        env: pluginConfig.presetEnv || {},
        extensions: {},
        cwd: rootPath,
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

      if (!swc.env!.coreJs) {
        swc.env!.coreJs = getCoreJsVersion(CORE_JS_PATH);
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

      if (isDebugMode()) {
        const { CheckPolyfillPlugin } = await import('./checkPolyfillPlugin');

        chain
          .plugin(CHAIN_ID.PLUGIN.SwcPolyfillCheckerPlugin)
          .use(new CheckPolyfillPlugin(swc));
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
    const meta = JSON.stringify({
      name: 'swc-minify',
      options: this.minifyOptions,
    });

    compiler.hooks.compilation.tap(PLUGIN_NAME, async compilation => {
      const { Compilation } = compiler.webpack;
      const { devtool } = compilation.options;

      this.minifyOptions.sourceMap =
        typeof devtool === 'string'
          ? devtool.includes('source-map')
          : Boolean(devtool);
      this.minifyOptions.inlineSourcesContent =
        typeof devtool === 'string' && devtool.includes('inline');

      compilation.hooks.chunkHash.tap(PLUGIN_NAME, (_, hash) =>
        hash.update(meta),
      );

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
    const cache = compilation.getCache(PLUGIN_NAME);

    const { SourceMapSource, RawSource } = compilation.compiler.webpack.sources;
    const assets = compilation
      .getAssets()
      // TODO handle css minify
      .filter(asset => !asset.info.minimized && JS_RE.test(asset.name));

    const assetsWithCache = await Promise.all(
      assets.map(async ({ name, info, source }) => {
        const eTag = cache.getLazyHashedEtag(source);
        const cacheItem = cache.getItemCache(name, eTag);
        return {
          name,
          info,
          source,
          cacheItem,
        };
      }),
    );

    return Promise.all(
      assetsWithCache.map(async asset => {
        const cache = await asset.cacheItem.getPromise<{
          minifiedSource: InstanceType<
            typeof SourceMapSource | typeof RawSource
          >;
        }>();

        let minifiedSource = cache ? cache.minifiedSource : null;

        if (!minifiedSource) {
          const { source, map } = asset.source.sourceAndMap();
          const minifyResult = await minify(
            asset.name,
            source.toString(),
            this.minifyOptions,
          );

          minifiedSource =
            this.minifyOptions.sourceMap && minifyResult.map
              ? new SourceMapSource(
                  minifyResult.code,
                  asset.name,
                  minifyResult.map,
                  source.toString(),
                  map,
                  true,
                )
              : new RawSource(minifyResult?.code || '');
        }

        await asset.cacheItem.storePromise({
          minifiedSource,
        });

        compilation.updateAsset(asset.name, minifiedSource, {
          ...asset.info,
          minimized: true,
        });
      }),
    );
  }
}

function determinePresetReact(root: string, pluginConfig: PluginSwcOptions) {
  let compilerOptions: Record<string, any>;
  try {
    const tsConfig = readTsConfig(root);
    assert(typeof tsConfig === 'object');
    assert('compilerOptions' in tsConfig);
    ({ compilerOptions } = tsConfig);
  } catch {
    return;
  }

  const presetReact =
    pluginConfig.presetReact || (pluginConfig.presetReact = {});

  let runtime: 'classic' | 'automatic' = 'automatic';
  if ('jsx' in compilerOptions) {
    switch (compilerOptions.jsx) {
      case 'react':
        runtime = 'classic';
        break;
      case 'react-jsx':
        runtime = 'automatic';
        break;
      default:
    }
    presetReact.runtime = runtime;
  }

  if (runtime === 'classic') {
    presetReact.pragmaFrag = compilerOptions.jsxFragmentFactory;
    presetReact.pragma = compilerOptions.jsxFactory;
  }

  if (runtime === 'automatic') {
    presetReact.importSource = compilerOptions.jsxImportSource;
  }
}

function isDebugMode(): boolean {
  return process.env[BUILDER_SWC_DEBUG_MODE] !== undefined;
}
