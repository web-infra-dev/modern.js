import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, WebpackPluginInstance } from 'webpack';

type NonceOptions = {
  nonce: string;
  HtmlPlugin: typeof HtmlWebpackPlugin;
};

export class HtmlNoncePlugin implements WebpackPluginInstance {
  readonly name: string;

  readonly nonce: string;

  readonly HtmlPlugin: typeof HtmlWebpackPlugin;

  constructor(options: NonceOptions) {
    const { nonce } = options;
    this.name = 'HtmlNoncePlugin';
    this.nonce = nonce;
    this.HtmlPlugin = options.HtmlPlugin;
  }

  apply(compiler: Compiler): void {
    if (!this.nonce) {
      return;
    }

    compiler.hooks.compilation.tap(this.name, compilation => {
      this.HtmlPlugin.getHooks(compilation).alterAssetTags.tapPromise(
        this.name,
        async alterAssetTags => {
          const {
            assetTags: { scripts },
          } = alterAssetTags;

          scripts.forEach(script => (script.attributes.nonce = this.nonce));
          return alterAssetTags;
        },
      );
    });
  }
}
