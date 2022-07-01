import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { CHAIN_ID, removeLeadingSlash } from '@modern-js/utils';
import { ClientWebpackConfig } from './client';

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

    this.jsChunkName = this.jsChunkName.replace(/\.js$/, '-es6.js');

    this.jsFilename = this.jsFilename.replace(/\.js$/, '-es6.js');

    this.babelPresetAppOptions = {
      target: 'client',
      useBuiltIns: false,
      useModern: true,
    };
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
}

export { ModernWebpackConfig };
