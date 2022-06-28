/* eslint-disable max-lines */
import path from 'path';
import {
  fs,
  chalk,
  isProd,
  isDev,
  signale,
  API_DIR,
  CHAIN_ID,
  isProdProfile,
  isTypescript,
  ensureAbsolutePath,
  isString,
  applyOptionsChain,
  removeLeadingSlash,
} from '@modern-js/utils';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import webpack, { IgnorePlugin } from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { createBabelChain, BabelChain } from '@modern-js/babel-chain';
import WebpackChain from '@modern-js/utils/webpack-chain';
import type { Options as BabelPrestAppOptions } from '@modern-js/babel-preset-app';
import { merge as webpackMerge } from '../../compiled/webpack-merge';
import WebpackBar from '../../compiled/webpackbar';
import {
  CSS_REGEX,
  JS_REGEX,
  TS_REGEX,
  SVG_REGEX,
  ASSETS_REGEX,
  CSS_MODULE_REGEX,
  GLOBAL_CSS_REGEX,
  JS_RESOLVE_EXTENSIONS,
  CACHE_DIRECTORY,
} from '../utils/constants';
import { createCSSRule, enableCssExtract } from '../utils/createCSSRule';
import { mergeRegex } from '../utils/mergeRegex';
import { getWebpackLogging } from '../utils/getWebpackLogging';
import { getBabelOptions, getUseBuiltIns } from '../utils/getBabelOptions';
import { ModuleScopePlugin } from '../plugins/module-scope-plugin';
import { getSourceIncludes } from '../utils/getSourceIncludes';
import { TsConfigPathsPlugin } from '../plugins/ts-config-paths-plugin';
import { getWebpackAliases } from '../utils/getWebpackAliases';
import { getWebpackUtils, isNodeModulesCss } from './shared';

export type ResolveAlias = { [index: string]: string };

const { USE, RULE, ONE_OF, PLUGIN, MINIMIZER, RESOLVE_PLUGIN } = CHAIN_ID;

class BaseWebpackConfig {
  chain: WebpackChain;

  appContext: IAppContext;

  metaName: string;

  options: NormalizedConfig;

  appDirectory: string;

  dist: string;

  jsFilename: string;

  jsChunkname: string;

  cssChunkname: string;

  mediaChunkname: string;

  babelChain: BabelChain;

  isTsProject: boolean;

  coreJsEntry: string;

  babelPresetAppOptions?: Partial<BabelPrestAppOptions>;

  constructor(appContext: IAppContext, options: NormalizedConfig) {
    this.appContext = appContext;

    this.appDirectory = this.appContext.appDirectory;

    this.metaName = this.appContext.metaName;

    this.options = options;

    this.chain = new WebpackChain();

    this.coreJsEntry = path.resolve(__dirname, '../runtime/core-js-entry.js');

    this.dist = ensureAbsolutePath(
      this.appDirectory,
      this.options.output ? this.options.output.path! : '',
    );

    this.jsFilename = removeLeadingSlash(
      `${(this.options.output
        ? this.options.output.jsPath!
        : ''
      ).trim()}/[name]${
        isProd() && !this.options.output?.disableAssetsCache
          ? '.[contenthash:8]'
          : ''
      }.js`,
    );

    this.jsChunkname = removeLeadingSlash(
      `${(this.options.output ? this.options.output.jsPath! : '').trim()}/[id]${
        isProd() && !this.options.output.disableAssetsCache
          ? '.[contenthash:8]'
          : ''
      }.js`,
    );

    this.cssChunkname = removeLeadingSlash(
      `${(this.options.output
        ? this.options.output.cssPath!
        : ''
      ).trim()}/[name]${
        isProd() && !this.options.output?.disableAssetsCache
          ? '.[contenthash:8]'
          : ''
      }.css`,
    );

    this.mediaChunkname = removeLeadingSlash(
      `${this.options.output ? this.options.output.mediaPath! : ''}/[name]${
        this.options.output?.disableAssetsCache ? '' : '.[hash:8]'
      }[ext]`,
    );

    this.babelChain = createBabelChain();

    this.isTsProject = isTypescript(this.appDirectory);
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
      .chunkFilename(this.jsChunkname)
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
      assetModuleFilename: this.mediaChunkname,
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
      .rule(RULE.MJS)
      .test(/\.m?js/)
      .resolve.set('fullySpecified', false);

    const loaders = this.chain.module.rule(RULE.LOADERS);

    //  js、ts
    const useTsLoader = Boolean(this.options.output?.enableTsLoader);

    this.applyBabelLoader(loaders, useTsLoader);

    if (useTsLoader) {
      this.applyTsLoader(loaders);
    }

    const disableCssModuleExtension =
      this.options.output?.disableCssModuleExtension ?? false;

    // CSS modules
    createCSSRule(
      this.chain,
      {
        appDirectory: this.appDirectory,
        config: this.options,
      },
      {
        name: ONE_OF.CSS_MODULES,
        test: disableCssModuleExtension ? CSS_REGEX : CSS_MODULE_REGEX,
        exclude: disableCssModuleExtension
          ? [isNodeModulesCss, GLOBAL_CSS_REGEX]
          : [],
        genTSD: this.options.output?.enableCssModuleTSDeclaration,
      },
      {
        importLoaders: 1,
        esModule: false,
        modules: {
          localIdentName: this.options.output
            ? this.options.output.cssModuleLocalIdentName!
            : '',
          exportLocalsConvention: 'camelCase',
        },
        sourceMap: isProd() && !this.options.output?.disableSourceMap,
      },
    );

    // CSS (not modules)
    createCSSRule(
      this.chain,
      {
        appDirectory: this.appDirectory,
        config: this.options,
      },
      {
        name: ONE_OF.CSS,
        test: CSS_REGEX,
      },
      {
        importLoaders: 1,
        esModule: false,
        sourceMap: isProd() && !this.options.output?.disableSourceMap,
      },
    );

    // svg
    loaders
      .oneOf(ONE_OF.SVG_INLINE)
      .test(SVG_REGEX)
      .type('javascript/auto')
      .resourceQuery(/inline/)
      .use(USE.SVGR)
      .loader(require.resolve('@svgr/webpack'))
      .options({ svgo: false })
      .end()
      .use(USE.URL)
      .loader(require.resolve('../../compiled/url-loader'))
      .options({
        limit: Infinity,
        name: this.mediaChunkname.replace(/\[ext\]$/, '.[ext]'),
      });

    loaders
      .oneOf(ONE_OF.SVG_URL)
      .test(SVG_REGEX)
      .type('javascript/auto')
      .resourceQuery(/url/)
      .use(USE.SVGR)
      .loader(require.resolve('@svgr/webpack'))
      .options({ svgo: false })
      .end()
      .use(USE.URL)
      .loader(require.resolve('../../compiled/url-loader'))
      .options({
        limit: false,
        name: this.mediaChunkname.replace(/\[ext\]$/, '.[ext]'),
      });

    loaders
      .oneOf(ONE_OF.SVG)
      .test(SVG_REGEX)
      .type('javascript/auto')
      .use(USE.SVGR)
      .loader(require.resolve('@svgr/webpack'))
      .options({ svgo: false })
      .end()
      .use(USE.URL)
      .loader(require.resolve('../../compiled/url-loader'))
      .options({
        limit: this.options.output?.dataUriLimit,
        name: this.mediaChunkname.replace(/\[ext\]$/, '.[ext]'),
      });

    // img, font assets
    loaders
      .oneOf(ONE_OF.ASSETS_INLINE)
      .test(ASSETS_REGEX)
      .type('asset/inline' as any)
      .resourceQuery(/inline/);

    loaders
      .oneOf(ONE_OF.ASSETS_URL)
      .test(ASSETS_REGEX)
      .type('asset/resource' as any)
      .resourceQuery(/url/);

    loaders
      .oneOf(ONE_OF.ASSETS)
      .test(ASSETS_REGEX)
      .type('asset' as any)
      .parser({
        dataUrlCondition: { maxSize: this.options.output?.dataUriLimit },
      });

    // yml, toml, markdown
    loaders
      .oneOf(ONE_OF.YAML)
      .test(/\.ya?ml$/)
      .use(USE.YAML)
      .loader(require.resolve('../../compiled/yaml-loader'));

    loaders
      .oneOf(ONE_OF.TOML)
      .test(/\.toml$/)
      .use(USE.TOML)
      .loader(require.resolve('../../compiled/toml-loader'));

    loaders
      .oneOf(ONE_OF.MARKDOWN)
      .test(/\.md$/)
      .use(USE.HTML)
      .loader(require.resolve('html-loader'))
      .end()
      .use(USE.MARKDOWN)
      .loader(require.resolve('../../compiled/markdown-loader'));

    //  resource fallback
    loaders
      .oneOf(ONE_OF.FALLBACK)
      .exclude.add(/^$/)
      .add(JS_REGEX)
      .add(TS_REGEX)
      .add(CSS_REGEX)
      .add(/\.(html?|json|wasm|ya?ml|toml|md)$/)
      .end()
      .use(USE.FILE)
      .loader(require.resolve('../../compiled/file-loader'));

    return loaders;
  }

  plugins() {
    // progress bar
    this.chain
      .plugin(PLUGIN.PROGRESS)
      .use(WebpackBar, [{ name: this.chain.get('name') }]);

    if (enableCssExtract(this.options)) {
      this.chain.plugin(PLUGIN.MINI_CSS_EXTRACT).use(MiniCssExtractPlugin, [
        {
          filename: this.cssChunkname,
          chunkFilename: this.cssChunkname,
          ignoreOrder: true,
        },
      ]);
    }

    this.chain.plugin(PLUGIN.IGNORE).use(IgnorePlugin, [
      {
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      },
    ]);

    const { output } = this.options;
    if (
      // only enable ts-checker plugin in ts project
      this.isTsProject &&
      // no need to use ts-checker plugin when using ts-loader
      !output.enableTsLoader &&
      !output.disableTsChecker
    ) {
      this.chain.plugin(PLUGIN.TS_CHECKER).use(ForkTsCheckerWebpackPlugin, [
        {
          typescript: {
            // avoid OOM issue
            memoryLimit: 8192,
            // use tsconfig of user project
            configFile: path.resolve(this.appDirectory, './tsconfig.json'),
            // use typescript of user project
            typescriptPath: require.resolve('typescript'),
          },
          // only display error messages
          logger: {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            log() {},
            error(message: string) {
              console.error(chalk.red.bold('TYPE'), message);
            },
          },
          issue: {
            include: [{ file: '**/src/**/*' }],
            exclude: [
              { file: '**/*.(spec|test).ts' },
              { file: '**/node_modules/**/*' },
            ],
          },
        },
      ]);
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

    //  resolve alias
    const defaultAlias: ResolveAlias = getWebpackAliases(
      this.appContext,
      this.options._raw,
    );

    const alias = applyOptionsChain<ResolveAlias, undefined>(
      defaultAlias,
      this.options.source?.alias as ResolveAlias,
    );

    for (const name of Object.keys(alias)) {
      this.chain.resolve.alias.set(
        name,
        (
          (Array.isArray(alias[name]) ? alias[name] : [alias[name]]) as string[]
        ).map(a =>
          /**
           * - Relative paths need to be turned into absolute paths
           * - Absolute paths or a package name are not processed
           */
          a.startsWith('.')
            ? (ensureAbsolutePath(this.appDirectory, a) as any)
            : a,
        ) as any,
      );
    }

    //  resolve modules
    this.chain.resolve.modules
      .add('node_modules')
      .add(this.appContext.nodeModulesDirectory);

    this.applyModuleScopePlugin();

    if (this.isTsProject) {
      // aliases from tsconfig.json
      this.chain.resolve
        .plugin(RESOLVE_PLUGIN.TS_CONFIG_PATHS)
        .use(TsConfigPathsPlugin, [this.appDirectory]);
    }
  }

  cache() {
    this.chain.cache({
      type: 'filesystem',
      cacheDirectory: path.resolve(
        this.appDirectory,
        CACHE_DIRECTORY,
        'webpack',
      ),
      buildDependencies: {
        defaultWebpack: [require.resolve('webpack/lib')],
        config: [__filename, this.appContext.configFile].filter(Boolean),
        tsconfig: [
          this.isTsProject &&
            path.resolve(this.appDirectory, './tsconfig.json'),
        ].filter(Boolean),
      },
    });
  }

  optimization() {
    this.chain.optimization
      .minimize(isProd() && !this.options.output?.disableMinimize)
      .splitChunks({ chunks: 'all' })
      .runtimeChunk({ name: (entrypoint: any) => `runtime-${entrypoint.name}` })
      .minimizer(MINIMIZER.JS)
      .use(TerserPlugin, [
        // FIXME: any type
        applyOptionsChain<any, any>(
          {
            terserOptions: {
              parse: { ecma: 8 },
              compress: {
                ecma: 5,
                warnings: false,
                comparisons: false,
                inline: 2,
              },
              mangle: { safari10: true },
              // Added for profiling in devtools
              keep_classnames: isProdProfile(),
              keep_fnames: isProdProfile(),
              output: {
                ecma: 5,
                ascii_only: true,
              },
            },
          },
          this.options.tools?.terser,
        ),
      ])
      .end()
      .minimizer(MINIMIZER.CSS)
      // FIXME: add `<any>` reason: Since the css-minimizer-webpack-plugin has been updated
      .use<any>(CssMinimizerPlugin, [
        applyOptionsChain({}, this.options.tools?.minifyCss),
      ]);
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

  applyModuleScopePlugin() {
    const userConfig = this.options._raw;

    // only apply module scope plugin when user config contains moduleScopes
    if (!userConfig?.source?.moduleScopes) {
      return;
    }

    let defaultScopes: Array<string | RegExp> = [
      './src',
      './shared',
      /node_modules/,
    ];

    const scopeOptions = this.options.source?.moduleScopes;

    if (Array.isArray(scopeOptions)) {
      if (scopeOptions.some(s => typeof s === 'function')) {
        for (const scope of scopeOptions) {
          if (typeof scope === 'function') {
            const ret = scope(defaultScopes);
            defaultScopes = ret ? ret : defaultScopes;
          } else {
            defaultScopes.push(scope as string | RegExp);
          }
        }
      } else {
        defaultScopes.push(...(scopeOptions as Array<string | RegExp>));
      }
    }

    this.chain.resolve
      .plugin(RESOLVE_PLUGIN.MODULE_SCOPE)
      .use(ModuleScopePlugin, [
        {
          appSrc: defaultScopes.map((scope: string | RegExp) => {
            if (isString(scope)) {
              return ensureAbsolutePath(this.appDirectory, scope);
            }
            return scope;
          }),
          allowedFiles: [path.resolve(this.appDirectory, './package.json')],
        },
      ]);
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

  /**
   * Condition of babel-loader and ts-loader.
   *
   * Will compile:
   * - All folders in app directory, such as `src/`, `shared/`...
   * - Internal folder `node_modules/.modern.js`
   * - User configured paths in `source.include`
   * - User configured paths in `addIncludes` of `tools.babel` and `tools.tsLoader`
   * - Entry file of core-js when `output.polyfill` is `entry`
   * - Internal sub-projects in modern.js monorepo: `/<MonorepoRoot>/features/*`
   *
   * Will not compile:
   * - All dependencies in `node_modules/`
   * - BFF API folder: `<appDirectory>/api`
   * - Folders outside the app directory, such as `../../packages/foo/`
   * - User configured paths in `addExcludes` of `tools.babel` and `tools.tsLoader`
   */
  applyScriptCondition(
    rule: WebpackChain.Rule<WebpackChain.Rule<WebpackChain.Module>>,
    includes: (string | RegExp)[],
    excludes: (string | RegExp)[],
  ) {
    // compile all folders in app directory, exclude node_modules
    rule.include.add({
      and: [this.appContext.appDirectory, { not: /node_modules/ }],
    });

    // internalDirectory should by compiled by default
    rule.include.add(this.appContext.internalDirectory);

    // let babel to transform core-js-entry, make `useBuiltins: 'entry'` working
    if (this.options.output.polyfill === 'entry') {
      rule.include.add(this.coreJsEntry);
    }

    // source.includes from modern.config.js
    const sourceIncludes = getSourceIncludes(this.appDirectory, this.options);
    sourceIncludes.forEach(condition => {
      rule.include.add(condition);
    });

    // exclude the api folder if exists
    const apiDir = path.resolve(this.appContext.appDirectory, API_DIR);
    if (fs.existsSync(apiDir)) {
      rule.exclude.add(apiDir);
    }

    includes.forEach(condition => {
      rule.include.add(condition);
    });
    excludes.forEach(condition => {
      rule.exclude.add(condition);
    });
  }

  applyBabelLoader(
    loaders: WebpackChain.Rule<WebpackChain.Module>,
    useTsLoader: boolean,
  ) {
    const { options, includes, excludes } = getBabelOptions(
      this.metaName,
      this.appDirectory,
      this.options,
      this.babelChain,
      this.babelPresetAppOptions,
    );

    const rule = loaders
      .oneOf(ONE_OF.JS)
      .test(useTsLoader ? JS_REGEX : mergeRegex(JS_REGEX, TS_REGEX));

    this.applyScriptCondition(rule, includes, excludes);

    rule
      .use(USE.BABEL)
      .loader(require.resolve('../../compiled/babel-loader'))
      .options(options);
  }

  applyTsLoader(loaders: WebpackChain.Rule<WebpackChain.Module>) {
    const babelLoaderOptions = {
      presets: [
        [
          require.resolve('@modern-js/babel-preset-app'),
          {
            metaName: this.metaName,
            appDirectory: this.appDirectory,
            target: 'client',
            useTsLoader: true,
            useBuiltIns: getUseBuiltIns(this.options),
            userBabelConfig: this.options.tools.babel,
          },
        ],
      ],
    };

    const includes: Array<string | RegExp> = [];
    const excludes: Array<string | RegExp> = [];

    const tsLoaderUtils = {
      addIncludes(items: string | RegExp | (string | RegExp)[]) {
        if (Array.isArray(items)) {
          includes.push(...items);
        } else {
          includes.push(items);
        }
      },
      addExcludes(items: string | RegExp | (string | RegExp)[]) {
        if (Array.isArray(items)) {
          excludes.push(...items);
        } else {
          excludes.push(items);
        }
      },
    };

    const tsLoaderOptions = applyOptionsChain(
      {
        compilerOptions: {
          target: 'es5',
          module: 'ESNext',
        },
        transpileOnly: false,
        allowTsInNodeModules: true,
      },
      this.options.tools?.tsLoader || {},
      tsLoaderUtils,
    );

    const rule = loaders.oneOf(ONE_OF.TS).test(TS_REGEX);

    this.applyScriptCondition(rule, includes, excludes);

    rule
      .use(USE.BABEL)
      .loader(require.resolve('../../compiled/babel-loader'))
      .options(babelLoaderOptions)
      .end()
      .use(USE.TS)
      .loader(require.resolve('ts-loader'))
      .options(tsLoaderOptions);
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
