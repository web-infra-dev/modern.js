import { createBabelChain } from '@modern-js/babel-chain';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import {
  applyOptionsChain,
  isUseSSRBundle,
  removeLeadingSlash,
} from '@modern-js/utils';
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

    this.babelChain = createBabelChain();
  }

  name() {
    this.chain.name('modern');
  }

  loaders() {
    const loaders = super.loaders();

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
              target: 'client',
              useLegacyDecorators: !this.options.output?.enableLatestDecorators,
              useBuiltIns: false,
              useModern: true,
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

    return loaders;
  }
}

export { ModernWebpackConfig };
