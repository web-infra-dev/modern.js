import fs from 'fs';
import path from 'path';
import {
  applyOptionsChain,
  isProd,
  isUseSSRBundle,
  SERVER_BUNDLE_DIRECTORY,
} from '@modern-js/utils';
import nodeExternals from 'webpack-node-externals';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { mergeRegex } from '../utils/mergeRegex';
import { getSourceIncludes } from '../utils/getSourceIncludes';
import { BaseWebpackConfig } from './base';
import { JS_RESOLVE_EXTENSIONS } from '../utils/constants';

class NodeWebpackConfig extends BaseWebpackConfig {
  get externalsAllowlist() {
    const includes = getSourceIncludes(this.appDirectory, this.options);
    return [
      (name: string) => {
        const ext = path.extname(name);

        return (
          name.includes('@modern-js/') ||
          (ext !== '' && !JS_RESOLVE_EXTENSIONS.includes(ext))
        );
      },
      includes.length && mergeRegex(...includes),
    ].filter(Boolean);
  }

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
    this.chain.optimization.minimize(false);
    this.chain.optimization.splitChunks(false as any).runtimeChunk(false);
  }

  loaders() {
    const loaders = super.loaders();
    // css & css modules
    if (loaders.oneOfs.has('css')) {
      loaders.oneOf('css').uses.delete('mini-css-extract');
    }

    loaders
      .oneOf('css-modules')
      .uses.delete('mini-css-extract')
      .end()
      .use('css')
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

    const babelOptions = loaders.oneOf('js').use('babel').get('options');

    loaders
      .oneOf('js')
      .use('babel')
      .options({
        ...babelOptions,
        presets: [
          [
            require.resolve('@modern-js/babel-preset-app'),
            {
              appDirectory: this.appDirectory,
              target: 'server',
              useLegacyDecorators: !this.options.output?.enableLatestDecorators,
              useBuiltIns: false,
              chain: this.babelChain,
              styledCompontents: applyOptionsChain(
                {
                  pure: true,
                  displayName: true,
                  ssr: isUseSSRBundle(this.options),
                  transpileTemplateLiterals: true,
                },
                (this.options.tools as any)?.styledComponents,
              ),
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
      this.chain.plugin('bundle-analyze').use(BundleAnalyzerPlugin, [
        {
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'report-ssr.html',
        },
      ]);
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

    // dsiable sourcemap
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

    // @modern-js/utils use typescript for peerDependency, but js project not depend it
    // if not externals, js ssr build error
    config.externals.push('typescript');

    config.resolve?.modules?.forEach((dir: string) => {
      if (fs.existsSync(dir)) {
        (config.externals as any[]).push(
          nodeExternals({
            allowlist: this.externalsAllowlist as any,
            modulesDir: dir,
          }),
        );
      }
    });

    return config;
  }
}

export { NodeWebpackConfig };
