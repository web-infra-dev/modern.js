import { removeLeadingSlash } from '@modern-js/utils';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import { ClientWebpackConfig } from './client';

class ModernWebpackConfig extends ClientWebpackConfig {
  htmlFilename: (name: string) => string;

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
  }

  name() {
    this.chain.name('modern');
  }
}

export { ModernWebpackConfig };
