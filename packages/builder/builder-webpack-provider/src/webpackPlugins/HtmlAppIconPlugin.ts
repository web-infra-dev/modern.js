import fs from 'fs';
import path, { join } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Compiler, Compilation, sources } from 'webpack';

type AppIconOptions = {
  distDir: string;
  iconPath: string;
};

export class HtmlAppIconPlugin {
  readonly name: string;

  readonly distDir: string;

  readonly iconPath: string;

  constructor(options: AppIconOptions) {
    this.name = 'HtmlAppIconPlugin';
    this.distDir = options.distDir;
    this.iconPath = options.iconPath;
  }

  apply(compiler: Compiler) {
    if (!fs.existsSync(this.iconPath)) {
      throw new Error(
        `[${this.name}] Can not find the app icon, please check if the '${this.iconPath}' file exists'.`,
      );
    }

    const iconRelativePath = join(this.distDir, path.basename(this.iconPath));

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
              href: `${publicPath as string}${iconRelativePath}`,
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
            assets[iconRelativePath] = new sources.RawSource(source, false);
          },
        );
      },
    );
  }
}
