import path from 'path';
import {
  isDev,
  isProd,
  CHAIN_ID,
  removeLeadingSlash,
  getEntryOptions,
  generateMetaTags,
  removeTailSlash,
  findExists,
  isFastRefresh,
} from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import webpack, { DefinePlugin, HotModuleReplacementPlugin } from 'webpack';
import { Entrypoint } from '@modern-js/types';
import { template as lodashTemplate } from '@modern-js/utils/lodash';
import { InlineChunkHtmlPlugin } from '../plugins/inline-html-chunk-plugin';
import { BottomTemplatePlugin } from '../plugins/bottom-template-plugin';
import { ICON_EXTENSIONS } from '../utils/constants';
import { BaseWebpackConfig } from './base';
import { addCoreJsEntry } from './features/babel';
import { applyManifestPlugin } from './features/manifest';
import { applyAppIconPlugin } from './features/app-icon';
import { applyCopyPlugin } from './features/copy';
import { applyBundleAnalyzerPlugin } from './features/bundle-analyzer';
import {
  applyReactRefreshBabelPlugin,
  applyReactRefreshPlugin,
} from './features/react-refresh';
import {
  applyNodePolyfillProvidePlugin,
  applyNodePolyfillResolve,
} from './features/node-polyfill';

const { PLUGIN } = CHAIN_ID;

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
    this.babelPresetAppOptions = {
      target: 'client',
    };
  }

  name() {
    this.chain.name('client');
  }

  entry() {
    super.entry();
    addCoreJsEntry({
      chain: this.chain,
      config: this.options,
    });
  }

  resolve() {
    super.resolve();

    if (!this.options.output.disableNodePolyfill) {
      applyNodePolyfillResolve(this.chain);
    }
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

    const isUsingHMR = isDev() && this.options.tools?.devServer?.hot !== false;
    if (isUsingHMR) {
      this.chain.plugin(PLUGIN.HMR).use(HotModuleReplacementPlugin);

      if (isFastRefresh()) {
        applyReactRefreshPlugin(this.chain);
        applyReactRefreshBabelPlugin(this.chain);
      }
    }

    applyCopyPlugin({
      chain: this.chain,
      config: this.options,
      appDirectory: this.appDirectory,
    });

    const { packageName } = this.appContext as IAppContext & {
      entrypoints: Entrypoint[];
    };

    const HtmlWebpackPlugin: typeof import('html-webpack-plugin') = require('html-webpack-plugin');

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

      this.chain
        .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`)
        .use(HtmlWebpackPlugin, [
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

    applyAppIconPlugin({
      chain: this.chain,
      config: this.options,
      appContext: this.appContext,
    });

    applyManifestPlugin({ chain: this.chain });

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
      applyNodePolyfillProvidePlugin(this.chain);
    }

    if (this.options.cliOptions?.analyze) {
      applyBundleAnalyzerPlugin({
        chain: this.chain,
        reportFilename: 'report.html',
      });
    }
  }
}
