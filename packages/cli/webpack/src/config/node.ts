import type {
  IAppContext,
  OutputConfig,
  ServerConfig,
  NormalizedConfig,
  SSGMultiEntryOptions,
} from '@modern-js/core';
import { CHAIN_ID, isProd, SERVER_BUNDLE_DIRECTORY } from '@modern-js/utils';
import type WebpackChain from '@modern-js/utils/webpack-chain';
import { BaseWebpackConfig } from './base';
import { applyBundleAnalyzerPlugin } from './features/bundle-analyzer';

export function filterEntriesBySSRConfig(
  chain: WebpackChain,
  serverConfig?: ServerConfig,
  outputConfig?: OutputConfig,
) {
  const entries = chain.entryPoints.entries();

  // if prod and ssg config is true
  if (isProd() && outputConfig?.ssg === true) {
    return;
  }

  // if single entry has ssg config
  const entryNames = Object.keys(entries);
  if (isProd() && entryNames.length === 1 && outputConfig?.ssg) {
    return;
  }

  // collect all ssg entries
  const ssgEntries: string[] = [];
  if (isProd() && outputConfig?.ssg) {
    const { ssg } = outputConfig;
    entryNames.forEach(name => {
      if ((ssg as SSGMultiEntryOptions)[name]) {
        ssgEntries.push(name);
      }
    });
  }

  const { ssr, ssrByEntries } = serverConfig || {};
  entryNames.forEach(name => {
    if (
      !ssgEntries.includes(name) &&
      ((ssr && ssrByEntries?.[name] === false) ||
        (!ssr && !ssrByEntries?.[name]))
    ) {
      chain.entryPoints.delete(name);
    }
  });
}

class NodeWebpackConfig extends BaseWebpackConfig {
  constructor(appContext: IAppContext, options: NormalizedConfig) {
    super(appContext, options);
    this.babelPresetAppOptions = {
      target: 'server',
      useBuiltIns: false,
    };
  }

  name() {
    this.chain.name('server');
  }

  target() {
    this.chain.target('node');
  }

  devtool() {
    this.chain.devtool(false);
  }

  entry() {
    super.entry();
    filterEntriesBySSRConfig(
      this.chain,
      this.options.server,
      this.options.output,
    );
  }

  output() {
    super.output();
    this.chain.output
      .libraryTarget('commonjs2')
      .filename(`${SERVER_BUNDLE_DIRECTORY}/[name].js`);

    this.chain.output.delete('chunkFilename');
  }

  optimization() {
    super.optimization();
    this.chain.optimization.splitChunks(false as any).runtimeChunk(false);
  }

  loaders() {
    const { USE, ONE_OF } = CHAIN_ID;
    const loaders = super.loaders();

    // css & css modules
    if (loaders.oneOfs.has(ONE_OF.CSS)) {
      loaders.oneOf(ONE_OF.CSS).uses.delete(USE.MINI_CSS_EXTRACT);
      loaders.oneOf(ONE_OF.CSS).uses.delete(USE.STYLE);
    }

    loaders
      .oneOf(ONE_OF.CSS_MODULES)
      .uses.delete(USE.MINI_CSS_EXTRACT)
      .end()
      .uses.delete(USE.STYLE)
      .end()
      .use(USE.CSS)
      .options({
        sourceMap: isProd() && !this.options.output?.disableSourceMap,
        importLoaders: 1,
        modules: {
          localIdentName: this.options.output
            ? this.options.output.cssModuleLocalIdentName!
            : '',
          exportLocalsConvention: 'camelCase',
          exportOnlyLocals: true,
        },
      });

    return loaders;
  }

  plugins() {
    super.plugins();

    // Avoid repeated execution of ts checker
    this.chain.plugins.delete(CHAIN_ID.PLUGIN.TS_CHECKER);

    if (this.options.cliOptions?.analyze) {
      applyBundleAnalyzerPlugin({
        ...this.chainUtils,
        reportFilename: 'report-ssr.html',
      });
    }
  }

  resolve() {
    super.resolve();
    for (const ext of [
      '.node.js',
      '.node.jsx',
      '.node.ts',
      '.node.tsx',
    ].reverse()) {
      this.chain.resolve.extensions.prepend(ext);
    }
    this.chain.resolve.mainFields.clear().add('main');
  }

  config() {
    const config = super.config();

    // prod bundle all dependencies
    if (isProd()) {
      config.externals = [];
      return config;
    }

    config.externals = config.externals || [];

    if (!Array.isArray(config.externals)) {
      config.externals = [config.externals].filter(Boolean);
    }

    return config;
  }
}

export { NodeWebpackConfig };
