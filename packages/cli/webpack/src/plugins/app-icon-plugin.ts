import fs from 'fs';
import path from 'path';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import { Compiler, Compilation, sources } from 'webpack';

export class AppIconPlugin {
  htmlWebpackPlugin: typeof HtmlWebpackPlugin;

  iconPath: string;

  name: string;

  constructor(htmlWebpackPlugin: typeof HtmlWebpackPlugin, iconPath: string) {
    this.htmlWebpackPlugin = htmlWebpackPlugin;
    this.iconPath = iconPath;
    this.name = 'app-icon';
  }

  apply(compiler: Compiler) {
    const { publicPath } = compiler.options.output;
    const iconName = path.basename(this.iconPath);
    // add html asset tags
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      this.htmlWebpackPlugin
        .getHooks(compilation)
        .alterAssetTagGroups.tap(this.name, data => {
          data.headTags.unshift({
            tagName: 'link',
            voidTag: true,
            attributes: {
              rel: 'apple-touch-icon',
              sizes: '180*180',
              href: `${publicPath as string}${iconName}`,
            },
            meta: {},
          });
          return data;
        });
    });
    // copy icon to dist
    compiler.hooks.thisCompilation.tap(
      'app-icon',
      (compilation: Compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'app-icon',
            stage: Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS,
          },
          assets => {
            const source = fs.readFileSync(this.iconPath);
            assets[iconName] = new sources.RawSource(source, false);
          },
        );
      },
    );
  }
}
