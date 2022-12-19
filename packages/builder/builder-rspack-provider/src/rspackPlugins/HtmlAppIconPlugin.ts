import fs from 'fs';
import path from 'path';
import HtmlPlugin from '@rspack/plugin-html';
import { Compiler } from '../types';
// @ts-expect-error
import { RawSource } from 'webpack-sources';

type AppIconOptions = {
  distDir: string;
  iconPath: string;
};

export class HtmlAppIconPlugin {
  readonly name: string;

  readonly iconPath: string;

  readonly distDir: string;

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

    const iconRelativePath = path.join(
      this.distDir,
      path.basename(this.iconPath),
    );

    // add html asset tags
    compiler.hooks.compilation.tap(this.name, compilation => {
      HtmlPlugin.getHooks(compilation).alterAssetTagGroups.tap(
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
    compiler.hooks.thisCompilation.tap(this.name, compilation => {
      const source = fs.readFileSync(this.iconPath);

      // todo: should import RawSource from rspack
      compilation.emitAsset(iconRelativePath, new RawSource(source), {
        minimized: false,
        development: false,
        hotModuleReplacement: false,
        related: {},
      });
    });
  }
}
