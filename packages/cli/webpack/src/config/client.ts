import path from 'path';
import {
  fs,
  isDev,
  isProd,
  removeLeadingSlash,
  getEntryOptions,
  generateMetaTags,
  removeTailSlash,
  findExists,
} from '@modern-js/utils';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import webpack, {
  DefinePlugin,
  HotModuleReplacementPlugin,
  ProvidePlugin,
} from 'webpack';
import { Entrypoint } from '@modern-js/types';
import { template as lodashTemplate } from '@modern-js/utils/lodash';
import CopyPlugin from '../../compiled/copy-webpack-plugin';
import { WebpackManifestPlugin } from '../../compiled/webpack-manifest-plugin';
import { InlineChunkHtmlPlugin } from '../plugins/inline-html-chunk-plugin';
import { AppIconPlugin } from '../plugins/app-icon-plugin';
import { BottomTemplatePlugin } from '../plugins/bottom-template-plugin';
import { ICON_EXTENSIONS } from '../utils/constants';
import { BaseWebpackConfig } from './base';
import { CHAIN_ID, enableBundleAnalyzer } from './shared';

const { PLUGIN } = CHAIN_ID;
const nodeLibsBrowser = require('node-libs-browser');

export class ClientWebpackConfig extends BaseWebpackConfig {
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

    if (this.options.output.polyfill === 'entry') {
      const entryPoints = Object.keys(this.chain.entryPoints.entries() || {});

      for (const name of entryPoints) {
        this.chain
          .entry(name)
          .prepend(require.resolve('regenerator-runtime/runtime'))
          .prepend(require.resolve('core-js'));
      }
    }
  }

  resolve() {
    super.resolve();

    // FIXME: local node_modules (WTF?)
    const wtfPath = path.resolve(__dirname, '../../../../node_modules');
    this.chain.resolve.modules.add(wtfPath);

    // node polyfill
    if (!this.options.output.disableNodePolyfill) {
      this.chain.resolve.merge({
        fallback: this.getNodePolyfill(),
      });
    }
  }

  private getNodePolyfill(): Record<string, string | false> {
    return Object.keys(nodeLibsBrowser).reduce<Record<string, string | false>>(
      (previous, name) => {
        if (nodeLibsBrowser[name]) {
          previous[name] = nodeLibsBrowser[name];
        } else {
          previous[name] = false;
        }
        return previous;
      },
      {},
    );
  }

  private getCustomPublicEnv() {
    const { metaName } = this.appContext;
    const prefix = `${metaName.split(/[-_]/)[0]}_`.toUpperCase();
    const envReg = new RegExp(`^${prefix}`);
    return Object.keys(process.env).filter(key => envReg.test(key));
  }

  private useDefinePlugin() {
    const { envVars, globalVars } = this.options.source || {};
    const publicEnvVars = this.getCustomPublicEnv();
    this.chain.plugin(PLUGIN.DEFINE).use(DefinePlugin, [
      {
        ...[
          'NODE_ENV',
          'BUILD_MODE',
          ...publicEnvVars,
          ...(envVars || []),
        ].reduce<Record<string, string>>((memo, name) => {
          memo[`process.env.${name}`] = JSON.stringify(process.env[name]);
          return memo;
        }, {}),
        ...Object.keys(globalVars || {}).reduce<Record<string, string>>(
          (memo, name) => {
            memo[name] = globalVars ? JSON.stringify(globalVars[name]) : '';
            return memo;
          },
          {},
        ),
      },
    ]);
  }

  plugins() {
    super.plugins();

    this.useDefinePlugin();
    this.useCopyPlugin();

    isDev() && this.chain.plugin(PLUGIN.HMR).use(HotModuleReplacementPlugin);

    const { packageName } = this.appContext as IAppContext & {
      entrypoints: Entrypoint[];
    };

    // output html files
    const entrypoints = Object.keys(this.chain.entryPoints.entries() || {});
    for (const entryName of entrypoints) {
      const baseTemplateParams = {
        entryName,
        title: getEntryOptions<string | undefined>(
          entryName,
          this.options.output.title,
          this.options.output.titleByEntries,
          packageName,
        ),
        mountId: this.options.output.mountId!,
        assetPrefix: removeTailSlash(this.chain.output.get('publicPath')),
        meta: generateMetaTags(
          getEntryOptions(
            entryName,
            this.options.output.meta,
            this.options.output.metaByEntries,
            packageName,
          ),
        ),
        ...getEntryOptions<Record<string, unknown> | undefined>(
          entryName,
          this.options.output.templateParameters,
          this.options.output.templateParametersByEntries,
          packageName,
        ),
      };

      this.chain.plugin(`html-${entryName}`).use(HtmlWebpackPlugin, [
        {
          __internal__: true, // flag for internal html-webpack-plugin usage
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
          favicon:
            getEntryOptions<string | undefined>(
              entryName,
              this.options.output.favicon,
              this.options.output.faviconByEntries,
              packageName,
            ) ||
            findExists(
              ICON_EXTENSIONS.map(ext =>
                path.resolve(
                  this.appContext.appDirectory,
                  this.options.source.configDir!,
                  `favicon.${ext}`,
                ),
              ),
            ),
          inject: getEntryOptions(
            entryName,
            this.options.output.inject,
            this.options.output.injectByEntries,
            packageName,
          ),
          templateParameters: (
            compilation: webpack.Compilation,
            assets,
            assetTags,
            pluginOptions,
          ) => ({
            webpackConfig: compilation.options,
            htmlWebpackPlugin: {
              tags: assetTags,
              files: assets,
              options: pluginOptions,
            },
            ...baseTemplateParams,
          }),
          bottomTemplate:
            this.appContext.htmlTemplates[`__${entryName}-bottom__`] &&
            lodashTemplate(
              this.appContext.htmlTemplates[`__${entryName}-bottom__`],
            )(baseTemplateParams),
        },
      ]);
    }

    this.chain
      .plugin(PLUGIN.BOTTOM_TEMPLATE)
      .use(BottomTemplatePlugin, [HtmlWebpackPlugin]);

    // add app icon
    const appIcon = findExists(
      ICON_EXTENSIONS.map(ext =>
        path.resolve(
          this.appContext.appDirectory,
          this.options.source.configDir!,
          `icon.${ext}`,
        ),
      ),
    );

    if (appIcon) {
      this.chain
        .plugin(PLUGIN.APP_ICON)
        .use(AppIconPlugin, [HtmlWebpackPlugin, appIcon]);
    }

    this.chain.plugin(PLUGIN.MANIFEST).use(WebpackManifestPlugin, [
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

    if (isProd()) {
      const {
        disableInlineRuntimeChunk,
        enableInlineStyles,
        enableInlineScripts,
      } = this.options.output;
      this.chain
        .plugin(PLUGIN.INLINE_HTML)
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
      this.chain.plugin(PLUGIN.NODE_POLYFILL_PROVIDE).use(ProvidePlugin, [
        {
          Buffer: [nodeLibsBrowser.buffer, 'Buffer'],
          process: [nodeLibsBrowser.process],
        },
      ]);
    }

    if (this.options.cliOptions?.analyze) {
      enableBundleAnalyzer(this.chain, 'report.html');
    }
  }

  useCopyPlugin() {
    const configDir = path.resolve(
      this.appDirectory,
      this.options.source.configDir!,
    );

    const patterns = [...(this.options.output.copy || [])];
    const uploadDir = path.posix.join(configDir.replace(/\\/g, '/'), 'upload');
    const publicDir = path.posix.join(configDir.replace(/\\/g, '/'), 'public');

    // add the pattern only if the corresponding directory exists,
    // otherwise it will cause the webpack recompile.
    if (fs.existsSync(uploadDir)) {
      patterns.push({
        from: '**/*',
        to: 'upload',
        context: uploadDir,
        noErrorOnMissing: true,
      });
    }

    if (fs.existsSync(publicDir)) {
      patterns.push({
        from: '**/*',
        to: 'public',
        context: publicDir,
        noErrorOnMissing: true,
        // eslint-disable-next-line node/prefer-global/buffer
        transform: (content: Buffer, absoluteFrom: string) => {
          if (!/\.html?$/.test(absoluteFrom)) {
            return content;
          }

          return lodashTemplate(content.toString('utf8'))({
            assetPrefix: removeTailSlash(this.chain.output.get('publicPath')),
          });
        },
      });
    }

    // options.patterns should be a non-empty array
    if (patterns.length) {
      this.chain.plugin(PLUGIN.COPY).use(CopyPlugin, [{ patterns }]);
    }
  }
}
