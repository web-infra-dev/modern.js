/* eslint-disable max-lines */
import path from 'path';
import Chain from 'webpack-chain';
import {
  isProd,
  isDev,
  isProdProfile,
  isTypescript,
  ensureAbsolutePath,
  isString,
  applyOptionsChain,
  removeLeadingSlash,
} from '@modern-js/utils';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import webpack, { IgnorePlugin } from 'webpack';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import { merge } from 'webpack-merge';
import WebpackBar from 'webpackbar';
import { createBabelChain, BabelChain } from '@modern-js/babel-chain';
import {
  CSS_REGEX,
  JS_REGEX,
  TS_REGEX,
  SVG_REGEX,
  ASSETS_REGEX,
  CSS_MODULE_REGEX,
  JS_RESOLVE_EXTENSIONS,
  CACHE_DIRECTORY,
} from '../utils/constants';
import { createCSSRule } from '../utils/createCSSRule';
import { mergeRegex } from '../utils/mergeRegex';
import { getWebpackLogging } from '../utils/getWebpackLogging';
import { getBabelOptions } from '../utils/getBabelOptions';
import { ModuleScopePlugin } from '../plugins/module-scope-plugin';
import { getSourceIncludes } from '../utils/getSourceIncludes';
import { TsConfigPathsPlugin } from '../plugins/ts-config-paths-plugin';
import { getWebpackAliases } from '../utils/getWebpackAliases';

export type ResolveAlias = { [index: string]: string };

class BaseWebpackConfig {
  chain: Chain;

  appContext: IAppContext;

  options: NormalizedConfig;

  appDirectory: string;

  dist: string;

  jsFilename: string;

  jsChunkname: string;

  cssChunkname: string;

  mediaChunkname: string;

  babelChain: BabelChain;

  constructor(appContext: IAppContext, options: NormalizedConfig) {
    this.appContext = appContext;

    this.appDirectory = this.appContext.appDirectory;

    this.options = options;

    this.chain = new Chain();

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
  }

  name() {
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
    const { entrypoints = [] } = this.appContext;

    for (const { entryName, entry } of entrypoints) {
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
    let publicPath =
      /* eslint-disable no-nested-ternary */
      isProd()
        ? this.options.output
          ? this.options.output.assetPrefix!
          : ''
        : isString(this.options.dev?.assetPrefix)
        ? this.options.dev.assetPrefix
        : (this.options.dev ? this.options.dev.assetPrefix : '')
        ? `//${this.appContext.ip || 'localhost'}:${
            this.appContext.port || '8080'
          }/`
        : '/';
    /* eslint-enable no-nested-ternary */

    if (!publicPath.endsWith('/')) {
      publicPath += '/';
    }

    return publicPath;
  }

  /* eslint-disable max-statements */
  loaders() {
    this.chain.module
      .rule('mjs')
      .test(/\.m?js/)
      .resolve.set('fullySpecified', false);

    const loaders = this.chain.module.rule('loaders');

    //  js、ts
    const useTsLoader = Boolean(this.options.output?.enableTsLoader);

    loaders
      .oneOf('js')
      .test(useTsLoader ? JS_REGEX : mergeRegex(JS_REGEX, TS_REGEX))
      .include.add(this.appContext.srcDirectory)
      .add(path.resolve(this.appDirectory, './node_modules/.modern-js'))
      .end()
      .use('babel')
      .loader(require.resolve('babel-loader'))
      .options(
        getBabelOptions(
          this.appDirectory,
          this.options,
          this.chain.get('name'),
          this.babelChain,
        ),
      );

    if (useTsLoader) {
      loaders
        .oneOf('ts')
        .test(TS_REGEX)
        .include.add(this.appContext.srcDirectory)
        .add(/node_modules\/\.modern-js\//)
        .end()
        .use('babel')
        .loader(require.resolve('babel-loader'))
        .options({
          presets: [
            [
              require.resolve('@modern-js/babel-preset-app'),
              {
                appDirectory: this.appDirectory,
                target: 'client',
                useTsLoader: true,
                useBuiltIns:
                  this.options.output.polyfill === 'ua'
                    ? false
                    : this.options.output.polyfill,
              },
            ],
          ],
        })
        .end()
        .use('ts')
        .loader(require.resolve('ts-loader'))
        .options(
          applyOptionsChain(
            {
              compilerOptions: {
                target: 'es5',
                module: 'ESNext',
              },
              transpileOnly: false,
              allowTsInNodeModules: true,
            },
            this.options.tools?.tsLoader,
          ),
        );
    }

    const includes = getSourceIncludes(this.appDirectory, this.options);

    for (const include of includes) {
      loaders.oneOf('js').include.add(include);
      loaders.oneOfs.has('ts') && loaders.oneOf('ts').include.add(include);
    }

    // css
    if (!this.options.output?.disableCssModuleExtension) {
      createCSSRule(
        this.chain,
        {
          appDirectory: this.appDirectory,
          config: this.options,
        },
        {
          name: 'css',
          test: CSS_REGEX,
          exclude: [CSS_MODULE_REGEX],
        },
        {
          importLoaders: 1,
          sourceMap: isProd() && !this.options.output?.disableSourceMap,
        },
      );
    }

    // css modules
    createCSSRule(
      this.chain,
      {
        appDirectory: this.appDirectory,
        config: this.options,
      },
      {
        name: 'css-modules',
        test: this.options.output?.disableCssModuleExtension
          ? CSS_REGEX
          : CSS_MODULE_REGEX,
        exclude: this.options.output?.disableCssModuleExtension
          ? [/node_modules/, /\.global\.css$/]
          : [],
        genTSD: this.options.output?.enableCssModuleTSDeclaration,
      },
      {
        importLoaders: 1,
        modules: {
          localIdentName: this.options.output
            ? this.options.output.cssModuleLocalIdentName!
            : '',
          exportLocalsConvention: 'camelCase',
        },
        sourceMap: isProd() && !this.options.output?.disableSourceMap,
      },
    );

    // svg
    loaders
      .oneOf('svg-inline')
      .test(SVG_REGEX)
      .type('javascript/auto')
      .resourceQuery(/inline/)
      .use('svgr')
      .loader(require.resolve('@svgr/webpack'))
      .options({ svgo: false })
      .end()
      .use('url')
      .loader(require.resolve('url-loader'))
      .options({
        limit: Infinity,
        name: this.mediaChunkname.replace(/\[ext\]$/, '.[ext]'),
      });

    loaders
      .oneOf('svg-url')
      .test(SVG_REGEX)
      .type('javascript/auto')
      .resourceQuery(/url/)
      .use('svgr')
      .loader(require.resolve('@svgr/webpack'))
      .options({ svgo: false })
      .end()
      .use('url')
      .loader(require.resolve('url-loader'))
      .options({
        limit: false,
        name: this.mediaChunkname.replace(/\[ext\]$/, '.[ext]'),
      });

    loaders
      .oneOf('svg')
      .test(SVG_REGEX)
      .type('javascript/auto')
      .use('svgr')
      .loader(require.resolve('@svgr/webpack'))
      .options({ svgo: false })
      .end()
      .use('url')
      .loader(require.resolve('url-loader'))
      .options({
        limit: this.options.output?.dataUriLimit,
        name: this.mediaChunkname.replace(/\[ext\]$/, '.[ext]'),
      });

    // img, font assets
    loaders
      .oneOf('assets-inline')
      .test(ASSETS_REGEX)
      .type('asset/inline' as any)
      .resourceQuery(/inline/);

    loaders
      .oneOf('assets-url')
      .test(ASSETS_REGEX)
      .type('asset/resource' as any)
      .resourceQuery(/url/);

    loaders
      .oneOf('assets')
      .test(ASSETS_REGEX)
      .type('asset' as any)
      .parser({
        dataUrlCondition: { maxSize: this.options.output?.dataUriLimit },
      });

    // yml,toml, markdown
    loaders
      .oneOf('yml')
      .test(/\.ya?ml$/)
      .use('json')
      .loader(require.resolve('json-loader'))
      .end()
      .use('yaml')
      .loader('yaml-loader');

    loaders
      .oneOf('toml')
      .test(/\.toml$/)
      .use('toml')
      .loader(require.resolve('toml-loader'));

    loaders
      .oneOf('markdown')
      .test(/\.md$/)
      .use('html')
      .loader(require.resolve('html-loader'))
      .end()
      .use('markdown')
      .loader('markdown-loader');

    //  resource fallback
    loaders
      .oneOf('fallback')
      .exclude.add(/^$/)
      .add(JS_REGEX)
      .add(TS_REGEX)
      .add(CSS_REGEX)
      .add(CSS_MODULE_REGEX)
      .add(/\.(html?|json|wasm|ya?ml|toml|md)$/)
      .end()
      .use('file')
      .loader(require.resolve('file-loader'));

    return loaders;
  }
  /* eslint-enable max-statements */

  plugins() {
    // progress bar
    process.stdout.isTTY &&
      this.chain
        .plugin('progress')
        .use(WebpackBar, [{ name: this.chain.get('name') }]);

    isDev() &&
      this.chain.plugin('case-sensitive').use(CaseSensitivePathsPlugin);

    this.chain.plugin('mini-css-extract').use(MiniCssExtractPlugin, [
      {
        filename: this.cssChunkname,
        chunkFilename: this.cssChunkname,
        ignoreOrder: true,
      },
    ]);

    this.chain.plugin('ignore').use(IgnorePlugin, [
      {
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      },
    ]);
  }

  /* eslint-disable  max-statements */
  resolve() {
    // resolve extensions
    const extensions = JS_RESOLVE_EXTENSIONS.filter(
      ext => isTypescript(this.appContext.appDirectory) || !ext.includes('ts'),
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
        ).map(a => ensureAbsolutePath(this.appDirectory, a)) as any,
      );
    }

    //  resolve modules
    this.chain.resolve.modules
      .add('node_modules')
      .add(this.appContext.nodeModulesDirectory);

    let defaultScopes: any[] = ['./src', /node_modules/, './shared'];

    const scopeOptions = this.options.source?.moduleScopes;

    if (Array.isArray(scopeOptions)) {
      if (scopeOptions.some(s => typeof s === 'function')) {
        for (const scope of scopeOptions) {
          if (typeof scope === 'function') {
            const ret = scope(defaultScopes);
            defaultScopes = ret ? ret : defaultScopes;
          } else {
            defaultScopes.push(scope);
          }
        }
      } else {
        defaultScopes.push(...scopeOptions);
      }
    }

    // resolve plugin(module scope)
    this.chain.resolve.plugin('module-scope').use(ModuleScopePlugin, [
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

    if (isTypescript(this.appDirectory)) {
      // aliases from tsconfig.json
      this.chain.resolve
        .plugin('ts-config-paths')
        .use(TsConfigPathsPlugin, [this.appDirectory]);
    }
  }
  /* eslint-enable  max-statements */

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
          isTypescript(this.appDirectory) &&
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
      .minimizer('js')
      .use(TerserPlugin, [
        applyOptionsChain(
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
      ] as any)
      .end()
      .minimizer('css')
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
    const chainConfig = this.getChain().toConfig();
    if ((this.options.tools as any)?.webpackFinal) {
      return applyOptionsChain(
        chainConfig as any,
        (this.options.tools as any)?.webpackFinal,
        {
          name: this.chain.get('name'),
          webpack,
        },
        merge,
      );
    }
    return chainConfig;
  }

  getChain() {
    this.chain.context(this.appDirectory);

    this.chain.bail(isProd());
    this.chain.node.set('global', true);

    this.name();
    this.mode();
    this.devtool();
    this.entry();
    this.output();
    const loaders = this.loaders();
    this.plugins();
    this.resolve();
    this.cache();
    this.optimization();
    this.stats();

    loaders
      .oneOf('js')
      .use('babel')
      .options(
        applyOptionsChain(
          loaders.oneOf('js').use('babel').get('options'),
          this.options.tools?.babel,
          { chain: this.babelChain },
        ),
      );

    const config = this.chain.toConfig();

    applyOptionsChain(
      config as any,
      this.options.tools?.webpack,
      {
        chain: this.chain,
        name: this.chain.get('name'),
        webpack,
      },
      merge,
    );

    return this.chain;
  }
}

export { BaseWebpackConfig };
/* eslint-enable max-lines */
