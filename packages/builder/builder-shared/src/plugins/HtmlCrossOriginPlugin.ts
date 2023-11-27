import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { CrossOrigin } from '../types';
import type { Compiler, WebpackPluginInstance } from 'webpack';

type CrossOriginOptions = {
  crossOrigin: CrossOrigin;
  HtmlPlugin: typeof HtmlWebpackPlugin;
};

export class HtmlCrossOriginPlugin implements WebpackPluginInstance {
  readonly name: string;

  readonly crossOrigin: CrossOrigin;

  readonly HtmlPlugin: typeof HtmlWebpackPlugin;

  constructor(options: CrossOriginOptions) {
    const { crossOrigin } = options;
    this.name = 'HtmlCrossOriginPlugin';
    this.crossOrigin = crossOrigin;
    this.HtmlPlugin = options.HtmlPlugin;
  }

  apply(compiler: Compiler): void {
    if (
      !this.crossOrigin ||
      // align with webpack crossOriginLoading logic
      // https://github.com/webpack/webpack/blob/87660921808566ef3b8796f8df61bd79fc026108/lib/runtime/LoadScriptRuntimeModule.js#L104
      (compiler.options.output.publicPath === '/' &&
        this.crossOrigin !== ('use-credentials' as const))
    ) {
      return;
    }

    compiler.hooks.compilation.tap(this.name, compilation => {
      this.HtmlPlugin.getHooks(compilation).alterAssetTags.tapPromise(
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
