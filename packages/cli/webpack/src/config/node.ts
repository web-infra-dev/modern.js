import {
  applyOptionsChain,
  isProd,
  isUseSSRBundle,
  SERVER_BUNDLE_DIRECTORY,
} from '@modern-js/utils';
import { BaseWebpackConfig } from './base';
import { CHAIN_ID, enableBundleAnalyzer } from './shared';

class NodeWebpackConfig extends BaseWebpackConfig {
  name() {
    this.chain.name('server');
  }

  devtool() {
    this.chain.devtool(false);
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

    const babelOptions = loaders.oneOf(ONE_OF.JS).use(USE.BABEL).get('options');

    loaders
      .oneOf(ONE_OF.JS)
      .use(USE.BABEL)
      .options({
        ...babelOptions,
        presets: [
          [
            require.resolve('@modern-js/babel-preset-app'),
            {
              metaName: this.appContext.metaName,
              appDirectory: this.appDirectory,
              target: 'server',
              useLegacyDecorators: !this.options.output?.enableLatestDecorators,
              useBuiltIns: false,
              chain: this.babelChain,
              styledComponents: applyOptionsChain(
                {
                  pure: true,
                  displayName: true,
                  ssr: isUseSSRBundle(this.options),
                  transpileTemplateLiterals: true,
                },
                this.options.tools?.styledComponents,
              ),
              userBabelConfig: this.options.tools.babel,
            },
          ],
        ],
      });

    // TODO: ts-loader

    return loaders;
  }

  plugins() {
    super.plugins();

    if (this.options.cliOptions?.analyze) {
      enableBundleAnalyzer(this.chain, 'report-ssr.html');
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

    config.target = 'node';

    // disable sourcemap
    config.devtool = false;

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
