import fs from 'fs';
import path from 'path';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, Compilation } from 'webpack';
// @ts-expect-error
import { RawSource } from 'webpack-sources';
import { COMPILATION_PROCESS_STAGE } from './util';

type AppIconOptions = {
  distDir: string;
  iconPath: string;
  HtmlPlugin: typeof HtmlWebpackPlugin;
};

export class HtmlAppIconPlugin {
  readonly name: string;

  readonly distDir: string;

  readonly iconPath: string;

  readonly HtmlPlugin: typeof HtmlWebpackPlugin;

  constructor(options: AppIconOptions) {
    this.name = 'HtmlAppIconPlugin';
    this.distDir = options.distDir;
    this.iconPath = options.iconPath;
    this.HtmlPlugin = options.HtmlPlugin;
  }

  apply(compiler: Compiler) {
    if (!fs.existsSync(this.iconPath)) {
      throw new Error(
        `[${this.name}] Can not find the app icon, please check if the '${this.iconPath}' file exists'.`,
      );
    }

    const iconRelativePath = path.join(
      this.distDir,
      path.basename(this.iconPath),
    );

    // add html asset tags
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      this.HtmlPlugin.getHooks(compilation).alterAssetTagGroups.tap(
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
            stage: COMPILATION_PROCESS_STAGE.PROCESS_ASSETS_STAGE_PRE_PROCESS,
          },
          assets => {
            const source = fs.readFileSync(this.iconPath);
            assets[iconRelativePath] = new RawSource(source, false);
          },
        );
      },
    );
  }
}
