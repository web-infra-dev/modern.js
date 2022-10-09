/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * modified from https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/InlineChunkHtmlPlugin.js
 */
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { HtmlTagObject } from 'html-webpack-plugin';
import { Compiler, Compilation } from 'webpack';
import { isString } from '@modern-js/utils';

export class InlineChunkHtmlPlugin {
  htmlWebpackPlugin: typeof HtmlWebpackPlugin;

  tests: RegExp[];

  constructor(htmlWebpackPlugin: typeof HtmlWebpackPlugin, tests: RegExp[]) {
    this.htmlWebpackPlugin = htmlWebpackPlugin;
    this.tests = tests;
  }

  getInlinedScriptTag(
    publicPath: string,
    assets: Compilation['assets'],
    tag: HtmlTagObject,
  ) {
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
    const ret = {
      tagName: 'script',
      innerHTML: asset.source(),
      closeTag: true,
    };
    return ret;
  }

  getInlinedCSSTag(
    publicPath: string,
    assets: Compilation['assets'],
    tag: HtmlTagObject,
  ) {
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
    return {
      tagName: 'style',
      innerHTML: asset.source(),
      closeTag: true,
    };
  }

  getInlinedTag(
    publicPath: string,
    assets: Compilation['assets'],
    tag: HtmlTagObject,
  ) {
    if (tag.tagName === 'script') {
      return this.getInlinedScriptTag(publicPath, assets, tag) as HtmlTagObject;
    }

    if (
      tag.tagName === 'link' &&
      tag.attributes &&
      tag.attributes.rel === 'stylesheet'
    ) {
      return this.getInlinedCSSTag(publicPath, assets, tag) as HtmlTagObject;
    }

    return tag;
  }

  apply(compiler: Compiler) {
    let publicPath = compiler.options.output.publicPath || '';
    if (publicPath && !(publicPath as string).endsWith('/')) {
      publicPath += '/';
    }

    compiler.hooks.compilation.tap(
      'InlineChunkHtmlPlugin',
      (compilation: Compilation) => {
        const tagFunction = (tag: HtmlTagObject) =>
          this.getInlinedTag(publicPath as string, compilation.assets, tag);

        const hooks = this.htmlWebpackPlugin.getHooks(compilation);

        hooks.alterAssetTagGroups.tap('InlineChunkHtmlPlugin', assets => {
          const deferScriptTags = [];

          for (const headTag of assets.headTags) {
            if (headTag.tagName === 'script') {
              const { attributes } = headTag;
              if (attributes && attributes.defer === true) {
                deferScriptTags.push(headTag);
                assets.headTags.splice(assets.headTags.indexOf(headTag), 1);
              }
            }
          }

          assets.bodyTags = assets.bodyTags.concat(deferScriptTags);

          assets.headTags = assets.headTags.map(tagFunction);
          assets.bodyTags = assets.bodyTags.map(tagFunction);
          return assets;
        });
      },
    );
  }
}
