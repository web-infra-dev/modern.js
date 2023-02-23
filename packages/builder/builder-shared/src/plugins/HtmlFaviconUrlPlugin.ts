import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, Compilation } from 'webpack';

export type FaviconUrls = Array<{
  filename: string;
  url: string;
}>;

type FaviconUrlOptions = {
  faviconUrls: FaviconUrls;
  HtmlPlugin: typeof HtmlWebpackPlugin;
};

export class HtmlFaviconUrlPlugin {
  readonly name: string;

  readonly faviconUrls: FaviconUrls;

  readonly HtmlPlugin: typeof HtmlWebpackPlugin;

  constructor(options: FaviconUrlOptions) {
    this.name = 'HtmlFaviconUrlPlugin';
    this.faviconUrls = options.faviconUrls;
    this.HtmlPlugin = options.HtmlPlugin;
  }

  apply(compiler: Compiler) {
    // add html asset tags
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      this.HtmlPlugin.getHooks(compilation).alterAssetTagGroups.tap(
        this.name,
        data => {
          const matched = this.faviconUrls.find(
            item => item.filename === data.outputName,
          );

          if (matched) {
            data.headTags.unshift({
              tagName: 'link',
              voidTag: true,
              attributes: {
                rel: 'icon',
                href: matched.url,
              },
              meta: {},
            });
          }

          return data;
        },
      );
    });
  }
}
