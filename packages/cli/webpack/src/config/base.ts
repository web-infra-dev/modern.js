/* eslint-disable max-lines */
import path from 'path';
import {
  chalk,
  isProd,
  isDev,
  signale,
  CHAIN_ID,
  isString,
  isTypescript,
  ensureAbsolutePath,
  applyOptionsChain,
  removeLeadingSlash,
} from '@modern-js/utils';
import webpack from 'webpack';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import WebpackChain from '@modern-js/utils/webpack-chain';
import type { Options as BabelPrestAppOptions } from '@modern-js/babel-preset-app';
import { merge as webpackMerge } from '../../compiled/webpack-merge';
import { JS_RESOLVE_EXTENSIONS } from '../utils/constants';
import { enableCssExtract } from '../utils/createCSSRule';
import { getWebpackLogging } from '../utils/getWebpackLogging';
import { ChainUtils, getWebpackUtils } from './shared';
import { applyTsLoader, applyTsCheckerPlugin } from './features/ts';
import { applyBabelLoader } from './features/babel';
import { applyModuleScopePlugin } from './features/module-scope';
import { applyMinimizer } from './features/minimizer';
import { applySvgrLoader } from './features/svgr';
import { applyAlias, applyTsConfigPathsPlugins } from './features/alias';
import { applyAssetsLoader } from './features/assets';
import { applyCSSExtractPlugin, applyCSSLoaders } from './features/css';
import { applyYamlLoader } from './features/yaml';
import { applyTomlLoader } from './features/toml';
import { applyMarkdownLoader } from './features/markdown';
import { applyFallbackLoader } from './features/fallback';
import { applyProgressPlugin } from './features/progress';
import { applyIgnorePlugin } from './features/ignore';
import { applyFileSystemCache } from './features/cache';
import { applyDefinePlugin } from './features/define';

export type ResolveAlias = { [index: string]: string };

class BaseWebpackConfig {
  chain: WebpackChain;

  appContext: IAppContext;

  options: NormalizedConfig;

  appDirectory: string;

  dist: string;

  jsFilename: string;

  jsChunkName: string;

  cssChunkName: string;

  mediaChunkName: string;

  isTsProject: boolean;

  chainUtils: ChainUtils;

  babelPresetAppOptions?: Partial<BabelPrestAppOptions>;

  constructor(appContext: IAppContext, options: NormalizedConfig) {
    this.options = options;
    this.appContext = appContext;
    this.appDirectory = this.appContext.appDirectory;
    this.chain = new WebpackChain();

    const { output = {} } = this.options;
    const { disableAssetsCache } = output;
    const jsPath = (output.jsPath || '').trim();
    const cssPath = (output.cssPath || '').trim();
    const mediaPath = (output.mediaPath || '').trim();

    this.dist = ensureAbsolutePath(this.appDirectory, output.path || '');

    this.jsFilename = removeLeadingSlash(
      `${jsPath}/[name]${
        isProd() && !disableAssetsCache ? '.[contenthash:8]' : ''
      }.js`,
    );

    this.jsChunkName = removeLeadingSlash(
      `${jsPath}/[name]${
        isProd() && !disableAssetsCache ? '.[contenthash:8]' : ''
      }.js`,
    );

    this.cssChunkName = removeLeadingSlash(
      `${cssPath.trim()}/[name]${
        isProd() && !disableAssetsCache ? '.[contenthash:8]' : ''
      }.css`,
    );

    this.mediaChunkName = removeLeadingSlash(
      `${mediaPath}/[name]${disableAssetsCache ? '' : '.[hash:8]'}[ext]`,
    );

    this.isTsProject = isTypescript(this.appDirectory);

    this.chainUtils = {
      chain: this.chain,
      config: this.options,
      loaders: this.chain.module.rule(CHAIN_ID.RULE.LOADERS),
      appContext: this.appContext,
    };
  }

  name() {
    // empty
  }

  target() {
    // empty
  }

  mode() {
    const mode = isProd() ? 'production' : 'development';
    this.chain.mode(mode);
    return mode;
  }

  devtool() {
    const { output } = this.options;
    /* eslint-disable no-nested-ternary */
    this.chain.devtool(
      isProd()
        ? output?.disableSourceMap
          ? false
          : 'source-map'
        : 'cheap-module-source-map',
    );
    /* eslint-enable no-nested-ternary */
  }

  entry() {
    const { entrypoints = [], checkedEntries } = this.appContext;

    for (const { entryName, entry } of entrypoints) {
      if (checkedEntries && !checkedEntries.includes(entryName)) {
        continue;
      }
      this.chain.entry(entryName).add(entry);
    }
  }

  output() {
    this.chain.output
      .hashFunction('xxhash64')
      .filename(this.jsFilename)
      .chunkFilename(this.jsChunkName)
      .globalObject('window')
      .path(this.dist)
      .pathinfo(!isProd())
      .devtoolModuleFilenameTemplate(
        // eslint-disable-next-line no-nested-ternary
        isProd()
          ? (info: any) =>
              path
                .relative(
                  this.appContext.srcDirectory,
                  info.absoluteResourcePath,
                )
                .replace(/\\/g, '/')
          : isDev()
          ? (info: any) =>
              path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')
          : undefined,
      )
      .publicPath(this.publicPath());

    this.chain.output.merge({
      assetModuleFilename: this.mediaChunkName,
      environment: {
        arrowFunction: false,
        bigIntLiteral: false,
        const: false,
        destructuring: false,
        dynamicImport: false,
        forOf: false,
        module: false,
      },
    });
  }

  publicPath() {
    const { dev, output } = this.options;

    let publicPath = '/';

    if (isProd()) {
      if (output?.assetPrefix) {
        publicPath = output.assetPrefix;
      }
    } else if (isString(dev?.assetPrefix)) {
      publicPath = dev.assetPrefix;
    } else if (dev?.assetPrefix === true) {
      const ip = this.appContext.ip || 'localhost';
      const port = this.appContext.port || '8080';
      publicPath = `//${ip}:${port}/`;
    }

    if (!publicPath.endsWith('/')) {
      publicPath += '/';
    }

    return publicPath;
  }

  loaders() {
    this.chain.module
      .rule(CHAIN_ID.RULE.MJS)
      .test(/\.m?js/)
      .resolve.set('fullySpecified', false);

    const loaders = this.chain.module.rule(CHAIN_ID.RULE.LOADERS);
    const useTsLoader = Boolean(this.options.output?.enableTsLoader);

    applyBabelLoader({
      ...this.chainUtils,
      useTsLoader,
      babelPresetAppOptions: this.babelPresetAppOptions,
    });

    if (useTsLoader) {
      applyTsLoader(this.chainUtils);
    }

    applyCSSLoaders(this.chainUtils);
    applySvgrLoader({
      ...this.chainUtils,
      mediaChunkName: this.mediaChunkName,
    });
    applyAssetsLoader(this.chainUtils);
    applyYamlLoader(this.chainUtils);
    applyTomlLoader(this.chainUtils);
    applyMarkdownLoader(this.chainUtils);
    applyFallbackLoader(this.chainUtils);

    return loaders;
  }

  plugins() {
    applyProgressPlugin(this.chainUtils);
    applyDefinePlugin(this.chainUtils);
    applyIgnorePlugin(this.chainUtils);

    if (enableCssExtract(this.options)) {
      applyCSSExtractPlugin({
        ...this.chainUtils,
        cssChunkName: this.cssChunkName,
      });
    }

    const { output } = this.options;
    // only enable ts-checker plugin in ts project
    // no need to use ts-checker plugin when using ts-loader
    if (
      this.isTsProject &&
      !output.enableTsLoader &&
      !output.disableTsChecker
    ) {
      applyTsCheckerPlugin(this.chainUtils);
    }
  }

  resolve() {
    // resolve extensions
    const extensions = JS_RESOLVE_EXTENSIONS.filter(
      ext => this.isTsProject || !ext.includes('ts'),
    );

    for (const ext of extensions) {
      this.chain.resolve.extensions.add(ext);
    }

    applyAlias(this.chainUtils);

    //  resolve modules
    this.chain.resolve.modules
      .add('node_modules')
      .add(this.appContext.nodeModulesDirectory);

    // only apply module scope plugin when user config contains moduleScopes
    if (this.options._raw?.source?.moduleScopes) {
      applyModuleScopePlugin(this.chainUtils);
    }

    if (this.isTsProject) {
      applyTsConfigPathsPlugins(this.chainUtils);
    }
  }

  cache() {
    applyFileSystemCache({
      ...this.chainUtils,
      isTsProject: this.isTsProject,
    });
  }

  optimization() {
    const minimize = isProd() && !this.options.output?.disableMinimize;

    this.chain.optimization
      .minimize(minimize)
      .splitChunks({ chunks: 'all' })
      .runtimeChunk({
        name: (entrypoint: any) => `runtime-${entrypoint.name}`,
      });

    if (minimize) {
      applyMinimizer(this.chainUtils);
    }
  }

  stats() {
    this.chain.stats('none');
    this.chain.merge({ infrastructureLogging: getWebpackLogging() });
  }

  config() {
    const chain = this.getChain();
    const chainConfig = chain.toConfig();

    let finalConfig = chainConfig;

    if (this.options.tools?.webpack) {
      let isChainUsed = false;

      const proxiedChain = new Proxy(chain, {
        get(target, property) {
          isChainUsed = true;
          return (target as any)[property];
        },
      });

      const mergedConfig = applyOptionsChain(
        chainConfig,
        this.options.tools?.webpack,
        {
          chain: proxiedChain,
          env: process.env.NODE_ENV!,
          name: chain.get('name'),
          webpack,
          ...getWebpackUtils(chainConfig),
        },
        webpackMerge,
      );

      // Compatible with the legacy `chain` usage, if `chain` is called in `tools.webpack`,
      // using the chained config as finalConfig, otherwise using the merged webpack config.
      if (isChainUsed) {
        finalConfig = chain.toConfig();

        if (isDev()) {
          signale.warn(
            `The ${chalk.cyan('chain')} param of ${chalk.cyan(
              'tools.webpack',
            )} is deprecated, please use ${chalk.cyan(
              'tools.webpackChain',
            )} instead.`,
          );
        }
      } else {
        finalConfig = mergedConfig;
      }
    }

    // TODO remove webpackFinal
    if ((this.options.tools as any)?.webpackFinal) {
      return applyOptionsChain(
        finalConfig,
        (this.options.tools as any)?.webpackFinal,
        {
          name: chain.get('name'),
          webpack,
        },
        webpackMerge,
      );
    }

    return finalConfig;
  }

  applyToolsWebpackChain() {
    if (!this.options.tools) {
      return;
    }

    const { webpackChain } = this.options.tools;
    if (webpackChain) {
      const toArray = <T>(item: T | T[]): T[] =>
        Array.isArray(item) ? item : [item];

      toArray(webpackChain).forEach(item => {
        item(this.chain, {
          env: process.env.NODE_ENV!,
          name: this.chain.get('name'),
          webpack,
          CHAIN_ID,
        });
      });
    }
  }

  getChain() {
    this.chain.context(this.appDirectory);

    this.chain.bail(isProd());
    this.chain.node.set('global', true);

    this.name();
    this.target();
    this.mode();
    this.devtool();
    this.entry();
    this.output();
    this.loaders();
    this.plugins();
    this.resolve();
    this.cache();
    this.optimization();
    this.stats();
    this.applyToolsWebpackChain();

    return this.chain;
  }
}

export { BaseWebpackConfig };
/* eslint-enable max-lines */
