/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * modified from https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/InlineChunkHtmlPlugin.js
 */
import { join } from 'path';
import { isFunction, isString } from '@modern-js/utils';
import { addTrailingSlash } from '../utils';
import type { Compiler, Compilation } from 'webpack';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { HtmlTagObject } from 'html-webpack-plugin';
import { COMPILATION_PROCESS_STAGE, getPublicPathFromCompiler } from './util';

export type InlineChunkTestFunction = (params: {
  size: number;
  name: string;
}) => boolean;
export type InlineChunkTest = RegExp | InlineChunkTestFunction;

export type InlineChunkHtmlPluginOptions = {
  styleTests: InlineChunkTest[];
  scriptTests: InlineChunkTest[];
  distPath: {
    js?: string;
    css?: string;
  };
};

export class InlineChunkHtmlPlugin {
  name: string;

  styleTests: InlineChunkTest[];

  scriptTests: InlineChunkTest[];

  distPath: InlineChunkHtmlPluginOptions['distPath'];

  inlinedAssets: Set<string>;

  htmlPlugin: typeof HtmlWebpackPlugin;

  constructor(
    htmlPlugin: typeof HtmlWebpackPlugin,
    { styleTests, scriptTests, distPath }: InlineChunkHtmlPluginOptions,
  ) {
    this.name = 'InlineChunkHtmlPlugin';
    this.styleTests = styleTests;
    this.scriptTests = scriptTests;
    this.distPath = distPath;
    this.inlinedAssets = new Set();
    this.htmlPlugin = htmlPlugin;
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

  matchTests(name: string, source: string, tests: InlineChunkTest[]) {
    return tests.some(test => {
      if (isFunction(test)) {
        const size = source.length;
        return test({ name, size });
      }
      return test.exec(name);
    });
  }

  getInlinedScriptTag(
    publicPath: string,
    tag: HtmlTagObject,
    compilation: Compilation,
  ) {
    const { assets } = compilation;

    // No need to inline scripts with src attribute
    if (!(tag?.attributes.src && isString(tag.attributes.src))) {
      return tag;
    }

    const { src, ...otherAttrs } = tag.attributes;
    const scriptName = publicPath ? src.replace(publicPath, '') : src;

    // If asset is not found, skip it
    const asset = assets[scriptName];
    if (asset == null) {
      return tag;
    }

    const source = asset.source().toString();
    const shouldInline = this.matchTests(scriptName, source, this.scriptTests);
    if (!shouldInline) {
      return tag;
    }

    const ret = {
      tagName: 'script',
      innerHTML: this.updateSourceMappingURL({
        source,
        compilation,
        publicPath,
        type: 'js',
      }),
      attributes: {
        ...otherAttrs,
      },
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

    // No need to inline styles with href attribute
    if (!(tag.attributes.href && isString(tag.attributes.href))) {
      return tag;
    }

    const linkName = publicPath
      ? tag.attributes.href.replace(publicPath, '')
      : tag.attributes.href;

    // If asset is not found, skip it
    const asset = assets[linkName];
    if (asset == null) {
      return tag;
    }

    const source = asset.source().toString();
    const shouldInline = this.matchTests(linkName, source, this.styleTests);
    if (!shouldInline) {
      return tag;
    }

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
      const publicPath = getPublicPathFromCompiler(compiler);

      const tagFunction = (tag: HtmlTagObject) =>
        this.getInlinedTag(publicPath, tag, compilation);

      const hooks = this.htmlPlugin.getHooks(compilation);

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
          stage: COMPILATION_PROCESS_STAGE.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        () => {
          const { devtool } = compiler.options;

          this.inlinedAssets.forEach(name => {
            // If the source map reference is removed,
            // we do not need to preserve the source map of inlined files
            if (devtool === 'hidden-source-map') {
              compilation.deleteAsset(name);
            } else {
              // use delete instead of compilation.deleteAsset
              // because we want to preserve the related files such as source map
              delete compilation.assets[name];
            }
          });
          this.inlinedAssets.clear();
        },
      );
    });
  }
}
