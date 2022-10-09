import fs from 'fs';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Compiler, Compilation, sources } from 'webpack';

type AppIconOptions = {
  iconPath: string;
};

export class HtmlAppIconPlugin {
  readonly name: string;

  readonly iconPath: string;

  constructor(options: AppIconOptions) {
    this.name = 'HtmlAppIconPlugin';
    this.iconPath = options.iconPath;
  }

  apply(compiler: Compiler) {
    const iconName = path.basename(this.iconPath);

    if (!fs.existsSync(this.iconPath)) {
      throw new Error(
        `[${this.name}] Can not find the app icon, please check if the '${this.iconPath}' file exists'.`,
      );
    }

    // add html asset tags
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tap(
        this.name,
        data => {
          const { publicPath } = compiler.options.output;

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
        },
      );
    });

    // copy icon to dist
    compiler.hooks.thisCompilation.tap(
      this.name,
      (compilation: Compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: this.name,
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
