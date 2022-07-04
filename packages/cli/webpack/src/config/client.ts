import {
  isDev,
  isProd,
  CHAIN_ID,
  removeLeadingSlash,
  isFastRefresh,
} from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { HotModuleReplacementPlugin } from 'webpack';
import { BaseWebpackConfig } from './base';
import { addCoreJsEntry } from './features/babel';
import { applyManifestPlugin } from './features/manifest';
import { applyAppIconPlugin } from './features/app-icon';
import { applyCopyPlugin } from './features/copy';
import { applyBundleAnalyzerPlugin } from './features/bundle-analyzer';
import {
  applyReactRefreshPlugin,
  applyReactRefreshBabelPlugin,
} from './features/react-refresh';
import {
  applyNodePolyfillResolve,
  applyNodePolyfillProvidePlugin,
} from './features/node-polyfill';
import { applyEnvVarsDefinePlugin } from './features/define';
import { applyInlineChunkPlugin } from './features/inline-chunk';
import { applyHTMLPlugin } from './features/html';

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
    addCoreJsEntry(this.chainUtils);
  }

  resolve() {
    super.resolve();

    if (!this.options.output.disableNodePolyfill) {
      applyNodePolyfillResolve(this.chainUtils);
    }
  }

  plugins() {
    super.plugins();

    applyEnvVarsDefinePlugin(this.chainUtils);

    const isUsingHMR = isDev() && this.options.tools?.devServer?.hot !== false;
    if (isUsingHMR) {
      this.chain.plugin(CHAIN_ID.PLUGIN.HMR).use(HotModuleReplacementPlugin);

      if (isFastRefresh()) {
        applyReactRefreshPlugin(this.chainUtils);
        applyReactRefreshBabelPlugin(this.chainUtils);
      }
    }

    applyCopyPlugin(this.chainUtils);
    applyHTMLPlugin({
      ...this.chainUtils,
      htmlFilename: this.htmlFilename,
    });
    applyAppIconPlugin(this.chainUtils);
    applyManifestPlugin(this.chainUtils);

    if (isProd()) {
      applyInlineChunkPlugin(this.chainUtils);
    }

    // node polyfill
    if (!this.options.output.disableNodePolyfill) {
      applyNodePolyfillProvidePlugin(this.chainUtils);
    }

    if (this.options.cliOptions?.analyze) {
      applyBundleAnalyzerPlugin({
        ...this.chainUtils,
        reportFilename: 'report.html',
      });
    }
  }
}
