/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * modified from https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/InlineChunkHtmlPlugin.js
 */
import { join } from 'path';
import { isString } from '@modern-js/utils';
import { addTrailingSlash } from '@modern-js/builder-shared';
import { Compiler, Compilation } from 'webpack';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { HtmlTagObject } from 'html-webpack-plugin';

export type InlineChunkHtmlPluginOptions = {
  tests: RegExp[];
  distPath: {
    js?: string;
    css?: string;
  };
};

export class InlineChunkHtmlPlugin {
  name: string;

  tests: RegExp[];

  distPath: InlineChunkHtmlPluginOptions['distPath'];

  inlinedAssets: Set<string>;

  htmlWebpackPlugin: typeof HtmlWebpackPlugin;

  constructor(
    htmlWebpackPlugin: typeof HtmlWebpackPlugin,
    { tests, distPath }: InlineChunkHtmlPluginOptions,
  ) {
    this.name = 'InlineChunkHtmlPlugin';
    this.tests = tests;
    this.distPath = distPath;
    this.inlinedAssets = new Set();
    this.htmlWebpackPlugin = htmlWebpackPlugin;
  }

  /**
   * If we inlined the chunk to HTML,we should update the value of sourceMappingURL,
   * because the relative path of source code has been changed.
   * @param source
   */
  updateSourceMappingURL({
    source,
    compilation,
    publicPath,
    type,
  }: {
    source: string;
    compilation: Compilation;
    publicPath: string;
    type: 'js' | 'css';
  }) {
    const { devtool } = compilation.options;

    if (
      devtool &&
      // If the source map is inlined, we do not need to update the sourceMappingURL
      !devtool.includes('inline') &&
      source.includes('# sourceMappingURL')
    ) {
      const prefix = addTrailingSlash(
        join(publicPath, this.distPath[type] || ''),
      );

      return source.replace(
        /# sourceMappingURL=/,
        `# sourceMappingURL=${prefix}`,
      );
    }

    return source;
  }

  getInlinedScriptTag(
    publicPath: string,
    tag: HtmlTagObject,
    compilation: Compilation,
  ) {
    const { assets } = compilation;

    if (!(tag?.attributes.src && isString(tag.attributes.src))) {
      return tag;
    }
    const scriptName = publicPath
      ? tag.attributes.src.replace(publicPath, '')
      : tag.attributes.src;

    if (!this.tests.some(test => test.exec(scriptName))) {
      return tag;
    }
    const asset = assets[scriptName];
    if (asset == null) {
      return tag;
    }

    const source = asset.source().toString();
    const ret = {
      tagName: 'script',
      innerHTML: this.updateSourceMappingURL({
        source,
        compilation,
        publicPath,
        type: 'js',
      }),
      closeTag: true,
    };

    // mark asset has already been inlined
    this.inlinedAssets.add(scriptName);

    return ret;
  }

  getInlinedCSSTag(
    publicPath: string,
    tag: HtmlTagObject,
    compilation: Compilation,
  ) {
    const { assets } = compilation;

    if (!(tag.attributes.href && isString(tag.attributes.href))) {
      return tag;
    }

    const linkName = publicPath
      ? tag.attributes.href.replace(publicPath, '')
      : tag.attributes.href;

    if (!this.tests.some(test => test.exec(linkName))) {
      return tag;
    }

    const asset = assets[linkName];

    const source = asset.source().toString();
    const ret = {
      tagName: 'style',
      innerHTML: this.updateSourceMappingURL({
        source,
        compilation,
        publicPath,
        type: 'css',
      }),
      closeTag: true,
    };

    // mark asset has already been inlined
    this.inlinedAssets.add(linkName);

    return ret;
  }

  getInlinedTag(
    publicPath: string,
    tag: HtmlTagObject,
    compilation: Compilation,
  ) {
    if (tag.tagName === 'script') {
      return this.getInlinedScriptTag(
        publicPath,
        tag,
        compilation,
      ) as HtmlTagObject;
    }

    if (
      tag.tagName === 'link' &&
      tag.attributes &&
      tag.attributes.rel === 'stylesheet'
    ) {
      return this.getInlinedCSSTag(
        publicPath,
        tag,
        compilation,
      ) as HtmlTagObject;
    }

    return tag;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      const publicPath =
        typeof compiler.options.output.publicPath === 'string'
          ? addTrailingSlash(compiler.options.output.publicPath)
          : '/';

      const tagFunction = (tag: HtmlTagObject) =>
        this.getInlinedTag(publicPath, tag, compilation);

      const hooks = this.htmlWebpackPlugin.getHooks(compilation);

      hooks.alterAssetTagGroups.tap(this.name, assets => {
        assets.headTags = assets.headTags.map(tagFunction);
        assets.bodyTags = assets.bodyTags.map(tagFunction);
        return assets;
      });

      compilation.hooks.processAssets.tap(
        {
          name: 'InlineChunkHtmlPlugin',
          /**
           * Remove marked inline assets in summarize stage,
           * which should be later than the emitting of html-webpack-plugin
           */
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        () => {
          this.inlinedAssets.forEach(name => {
            // use delete instead of compilation.deleteAsset
            // because we want to preserve the related files such as source map
            delete compilation.assets[name];
          });
          this.inlinedAssets.clear();
        },
      );
    });
  }
}
