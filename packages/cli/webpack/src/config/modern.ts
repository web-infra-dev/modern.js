import { IAppContext, NormalizedConfig } from '@modern-js/core';
import { removeLeadingSlash } from '@modern-js/utils';
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
    this.jsChunkname = this.jsChunkname.replace(/\.js$/, '-es6.js');

    this.jsFilename = this.jsFilename.replace(/\.js$/, '-es6.js');
  }

  name() {
    this.chain.name('modern');
  }
}

export { ModernWebpackConfig };
