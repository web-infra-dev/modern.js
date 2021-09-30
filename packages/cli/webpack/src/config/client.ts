import HtmlWebpackPlugin from 'html-webpack-plugin';
import {
  isDev,
  isProd,
  removeLeadingSlash,
  getEntryOptions,
  generateMetaTags,
} from '@modern-js/utils';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import webpack, { HotModuleReplacementPlugin, ProvidePlugin } from 'webpack';
import nodeLibsBrowser from 'node-libs-browser';
import { Entrypoint } from '@modern-js/types';
import { RouteManifest } from '../plugins/route-manifest-plugin';
import { InlineChunkHtmlPlugin } from '../plugins/inline-html-chunk-plugin';
import { BaseWebpackConfig } from './base';

class ClientWebpackConfig extends BaseWebpackConfig {
  htmlFilename: (name: string) => string;

  constructor(appContext: IAppContext, options: NormalizedConfig) {
    super(appContext, options);
    this.htmlFilename = (name: string) =>
      removeLeadingSlash(
        `${this.options.output.htmlPath!}/${
          this.options.output.disableHtmlFolder ? name : `${name}/index`
        }.html`,
      );
  }

  name() {
    this.chain.name('client');
  }

  entry() {
    super.entry();

    const entrypoints = Object.keys(this.chain.entryPoints.entries() || {});

    for (const [name] of entrypoints) {
      if (this.options.output.polyfill !== 'off') {
        this.chain
          .entry(name)
          .prepend(require.resolve('regenerator-runtime/runtime'))
          .prepend(require.resolve('core-js'));
      }
    }
  }

  resolve() {
    super.resolve();

    // node polyfill
    if (!this.options.output.disableNodePolyfill) {
      this.chain.resolve.merge({
        fallback: Object.keys(nodeLibsBrowser).reduce<
          Record<string, string | false>
        >((previous, name) => {
          if (nodeLibsBrowser[name]) {
            previous[name] = nodeLibsBrowser[name];
          } else {
            previous[name] = false;
          }
          return previous;
        }, {}),
      });
    }
  }

  plugins() {
    super.plugins();

    isDev() && this.chain.plugin('hmr').use(HotModuleReplacementPlugin);

    const { entrypoints = [] } = this.appContext as IAppContext & {
      entrypoints: Entrypoint[];
    };

    // output html files
    for (const { entryName } of entrypoints) {
      this.chain.plugin(`html-${entryName}`).use(HtmlWebpackPlugin, [
        {
          filename: this.htmlFilename(entryName),
          chunks: [entryName],
          template: this.appContext.htmlTemplates[entryName],
          minify: !isProd()
            ? false
            : {
                collapseWhitespace: true,
                removeComments: false,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
              },
          favicon: getEntryOptions<string | undefined>(
            entryName,
            this.options.output.favicon,
            this.options.output.faviconByEntries,
          ),
          inject: getEntryOptions(
            entryName,
            this.options.output.inject,
            this.options.output.injectByEntries,
          ),
          templateParameters: (
            compilation: webpack.Compilation,
            assets,
            assetTags,
            pluginOptions,
          ) => {
            let stats: any;
            return {
              entryName,
              get webpack() {
                return stats || (stats = compilation.getStats().toJson());
              },
              webpackConfig: compilation.options,
              htmlWebpackPlugin: {
                tags: assetTags,
                files: assets,
                options: pluginOptions,
              },
              title: getEntryOptions<string | undefined>(
                entryName,
                this.options.output.title,
                this.options.output.titleByEntries,
              ),
              mountId: this.options.output.mountId!,
              staticPrefix: this.chain.output.get('publicPath'),
              meta: generateMetaTags(
                getEntryOptions(
                  entryName,
                  this.options.output.meta,
                  this.options.output.metaByEntries,
                ),
              ),
              ...getEntryOptions<Record<string, unknown> | undefined>(
                entryName,
                this.options.output.templateParameters,
                this.options.output.templateParametersByEntries,
              ),
            };
          },
        },
      ]);
    }

    this.chain.plugin('webpack-manifest').use(WebpackManifestPlugin, [
      {
        fileName: 'asset-manifest.json',
        publicPath: this.chain.output.get('publicPath'),
        generate: (seed, files, entries) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);

          const entrypointFiles = Object.keys(entries).reduce<string[]>(
            (previous, name) =>
              previous.concat(
                entries[name].filter(fileName => !fileName.endsWith('.map')),
              ),
            [],
          );
          return {
            files: manifestFiles,
            entrypoints: entrypointFiles,
          } as any;
        },
      },
    ]);

    this.chain.plugin('route-manitest').use(RouteManifest, [
      {
        options: this.options,
        appContext: this.appContext,
      },
    ]);

    if (isProd()) {
      const {
        disableInlineRuntimeChunk,
        enableInlineStyles,
        enableInlineScripts,
      } = this.options.output;
      this.chain
        .plugin('inline-html')
        .use(InlineChunkHtmlPlugin, [
          HtmlWebpackPlugin,
          [
            enableInlineScripts && /\.js$/,
            enableInlineStyles && /\.css$/,
            !disableInlineRuntimeChunk && /runtime-.+[.]js$/,
          ].filter(Boolean) as RegExp[],
        ]);
    }

    // node polyfill
    if (!this.options.output.disableNodePolyfill) {
      this.chain.plugin('node-polyfill-provide').use(ProvidePlugin, [
        {
          Buffer: [nodeLibsBrowser.buffer, 'Buffer'],
          console: [nodeLibsBrowser.console],
          process: [nodeLibsBrowser.process],
        },
      ]);
    }
  }
}

export { ClientWebpackConfig };
