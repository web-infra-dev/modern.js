import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { CrossOrigin } from '@modern-js/builder-shared';
import type { Compiler, WebpackPluginInstance } from 'webpack';

type CrossOriginOptions = {
  crossOrigin: CrossOrigin;
};

export class HtmlCrossOriginPlugin implements WebpackPluginInstance {
  readonly name: string;

  readonly crossOrigin: CrossOrigin;

  constructor(options: CrossOriginOptions) {
    const { crossOrigin } = options;
    this.name = 'HtmlCrossOriginPlugin';
    this.crossOrigin = crossOrigin;
  }

  apply(compiler: Compiler): void {
    if (!this.crossOrigin) {
      return;
    }

    compiler.hooks.compilation.tap(this.name, compilation => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapPromise(
        this.name,
        async alterAssetTags => {
          const {
            assetTags: { scripts, styles },
          } = alterAssetTags;

          scripts.forEach(
            script => (script.attributes.crossorigin = this.crossOrigin),
          );
          styles.forEach(
            style => (style.attributes.crossorigin = this.crossOrigin),
          );

          return alterAssetTags;
        },
      );
    });
  }
}
