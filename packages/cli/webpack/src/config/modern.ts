import { createBabelChain } from '@modern-js/babel-chain';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import {
  applyOptionsChain,
  isUseSSRBundle,
  removeLeadingSlash,
} from '@modern-js/utils';
import { ClientWebpackConfig } from './client';
import { CHAIN_ID } from './shared';

class ModernWebpackConfig extends ClientWebpackConfig {
  constructor(appContext: IAppContext, options: NormalizedConfig) {
    super(appContext, options);
    this.htmlFilename = (name: string) =>
      removeLeadingSlash(
        `${this.options.output.htmlPath!}/${
          this.options.output.disableHtmlFolder
            ? `${name}-es6`
            : `${name}/index-es6`
        }.html`,
      );
    this.jsChunkname = this.jsChunkname.replace(/\.js$/, '-es6.js');

    this.jsFilename = this.jsFilename.replace(/\.js$/, '-es6.js');

    this.babelChain = createBabelChain();
  }

  name() {
    this.chain.name('modern');
  }

  plugins() {
    super.plugins();

    if (this.options.cliOptions?.analyze) {
      this.chain.plugin(CHAIN_ID.PLUGIN.BUNDLE_ANALYZER).tap(() => [
        {
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'report-modern.html',
        },
      ]);
    }
  }

  loaders() {
    const loaders = super.loaders();

    const babelOptions = loaders
      .oneOf(CHAIN_ID.ONE_OF.JS)
      .use(CHAIN_ID.USE.BABEL)
      .get('options');

    loaders
      .oneOf(CHAIN_ID.ONE_OF.JS)
      .use(CHAIN_ID.USE.BABEL)
      .options({
        ...babelOptions,
        presets: [
          [
            require.resolve('@modern-js/babel-preset-app'),
            {
              metaName: this.appContext.metaName,
              appDirectory: this.appDirectory,
              target: 'client',
              useLegacyDecorators: !this.options.output?.enableLatestDecorators,
              useBuiltIns: false,
              useModern: true,
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

    return loaders;
  }
}

export { ModernWebpackConfig };
