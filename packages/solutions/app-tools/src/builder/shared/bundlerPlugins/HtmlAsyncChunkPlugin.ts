import type { Rspack } from '@modern-js/builder';

export class HtmlAsyncChunkPlugin {
  name: string;

  htmlWebpackPlugin: typeof Rspack.HtmlRspackPlugin;

  constructor(htmlWebpackPlugin: typeof Rspack.HtmlRspackPlugin) {
    this.name = 'HtmlAsyncChunkPlugin';
    this.htmlWebpackPlugin = htmlWebpackPlugin;
  }

  apply(compiler: Rspack.Compiler) {
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
