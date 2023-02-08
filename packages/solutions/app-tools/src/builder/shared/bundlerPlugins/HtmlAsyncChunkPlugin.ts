import type { webpack } from '@modern-js/builder-webpack-provider';
import type { Rspack } from '@modern-js/builder-rspack-provider';
import type HtmlWebpackPlugin from '@modern-js/builder-webpack-provider/html-webpack-plugin';

export class HtmlAsyncChunkPlugin {
  name: string;

  htmlWebpackPlugin: typeof HtmlWebpackPlugin;

  constructor(htmlWebpackPlugin: typeof HtmlWebpackPlugin) {
    this.name = 'HtmlAsyncChunkPlugin';
    this.htmlWebpackPlugin = htmlWebpackPlugin;
  }

  apply(compiler: webpack.Compiler | Rspack.Compiler) {
    compiler.hooks.compilation.tap(this.name, compilation => {
      const hooks = this.htmlWebpackPlugin.getHooks(compilation as any);

      hooks.alterAssetTagGroups.tap(this.name, assets => {
        const tags = [...assets.headTags, ...assets.bodyTags];

        for (const tag of tags) {
          if (tag.tagName === 'script') {
            const { attributes } = tag;
            if (attributes && attributes.defer === true) {
              attributes.async = true;
              delete attributes.defer;
            }
          }
        }

        return assets;
      });
    });
  }
}
