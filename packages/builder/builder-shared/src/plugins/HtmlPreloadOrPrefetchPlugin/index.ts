/**
 * @license
 * Copyright 2018 Google Inc.
 * https://github.com/vuejs/preload-webpack-plugin/blob/master/src/index.js
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Compiler, WebpackPluginInstance, Compilation } from 'webpack';
import { upperFirst } from '@modern-js/utils/lodash';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import { PreloadOrPreFetchOption } from '../../types';
import {
  extractChunks,
  doesChunkBelongToHtml,
  determineAsValue,
  type BeforeAssetTagGenerationHtmlPluginData,
  type As,
} from './helpers';
import { getPublicPathFromCompiler } from '../util';
import { withPublicPath } from '../../url';

const defaultOptions = {
  type: 'async-chunks' as const,
};

type LinkType = 'preload' | 'prefetch';

interface Attributes {
  [attributeName: string]: string | boolean | null | undefined;
  href: string;
  rel: LinkType;
  as?: As;
  crossorigin?: string;
}

function filterResourceHints(
  resourceHints: HtmlWebpackPlugin.HtmlTagObject[],
  scripts: HtmlWebpackPlugin.HtmlTagObject[],
): HtmlWebpackPlugin.HtmlTagObject[] {
  return resourceHints.filter(
    resourceHint =>
      !scripts.find(
        script => script.attributes.src === resourceHint.attributes.href,
      ),
  );
}

function generateLinks(
  options: PreloadOrPreFetchOption,
  type: LinkType,
  compilation: Compilation,
  htmlPluginData: BeforeAssetTagGenerationHtmlPluginData,
  HTMLCount: number,
): HtmlWebpackPlugin.HtmlTagObject[] {
  // get all chunks
  const extractedChunks = extractChunks({
    compilation,
    includeType: options.type,
  });

  const htmlChunks =
    // Handle all chunks.
    options.type === 'all-assets' || HTMLCount === 1
      ? extractedChunks // Only handle chunks imported by this HtmlWebpackPlugin.
      : extractedChunks.filter(chunk =>
          // TODO: Not yet supported in rspack, maybe we should implement it in another way
          // https://github.com/web-infra-dev/rspack/issues/3896
          doesChunkBelongToHtml({
            chunk,
            compilation,
            htmlPluginData,
            pluginOptions: options,
          }),
        );

  // Flatten the list of files.
  const allFiles = htmlChunks.reduce(
    (accumulated: string[], chunk) =>
      accumulated.concat([
        ...chunk.files,
        // sourcemap files are inside auxiliaryFiles in webpack5
        ...(chunk.auxiliaryFiles || []),
      ]),
    [],
  );
  const uniqueFiles = new Set<string>(allFiles);
  const filteredFiles = [...uniqueFiles]
    // default exclude
    .filter(file => [/.map$/].every(regex => !regex.test(file)))
    .filter(
      file =>
        !options.include ||
        (typeof options.include === 'function'
          ? options.include(file)
          : options.include.some(regex => new RegExp(regex).test(file))),
    )
    .filter(
      file =>
        !options.exclude ||
        (typeof options.exclude === 'function'
          ? !options.exclude(file)
          : options.exclude.every(regex => !new RegExp(regex).test(file))),
    );

  // Sort to ensure the output is predictable.
  const sortedFilteredFiles = filteredFiles.sort();
  const links: HtmlWebpackPlugin.HtmlTagObject[] = [];
  const publicPath = getPublicPathFromCompiler(compilation.compiler);

  for (const file of sortedFilteredFiles) {
    const href = withPublicPath(file, publicPath);
    const attributes: Attributes = {
      href,
      rel: type,
    };

    if (type === 'preload') {
      // If we're preloading this resource (as opposed to prefetching),
      // then we need to set the 'as' attribute correctly.
      attributes.as = determineAsValue({
        href,
        file,
      });

      // On the off chance that we have a cross-origin 'href' attribute,
      // set crossOrigin on the <link> to trigger CORS mode. Non-CORS
      // fonts can't be used.
      if (attributes.as === 'font') {
        attributes.crossorigin = '';
      }
    }

    links.push({
      tagName: 'link',
      attributes,
      voidTag: true,
      meta: {},
    });
  }

  return links;
}

export class HTMLPreloadOrPrefetchPlugin implements WebpackPluginInstance {
  readonly options: PreloadOrPreFetchOption;

  resourceHints: HtmlWebpackPlugin.HtmlTagObject[] = [];

  type: LinkType;

  HtmlPlugin: typeof HtmlWebpackPlugin;

  HTMLCount: number;

  constructor(
    options: true | PreloadOrPreFetchOption,
    type: LinkType,
    HtmlPlugin: typeof HtmlWebpackPlugin,
    HTMLCount: number,
  ) {
    this.options = {
      ...defaultOptions,
      ...(typeof options === 'boolean' ? {} : options),
    };
    this.type = type;
    this.HtmlPlugin = HtmlPlugin;
    this.HTMLCount = HTMLCount;
  }

  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(this.constructor.name, compilation => {
      this.HtmlPlugin.getHooks(compilation).beforeAssetTagGeneration.tap(
        `HTML${upperFirst(this.type)}Plugin`,
        htmlPluginData => {
          this.resourceHints = generateLinks(
            this.options,
            this.type,
            compilation,
            htmlPluginData,
            this.HTMLCount,
          );

          return htmlPluginData;
        },
      );

      this.HtmlPlugin.getHooks(compilation).alterAssetTags.tap(
        `HTML${upperFirst(this.type)}Plugin`,
        htmlPluginData => {
          if (this.resourceHints) {
            htmlPluginData.assetTags.styles = [
              ...filterResourceHints(
                this.resourceHints,
                htmlPluginData.assetTags.scripts,
              ),
              ...htmlPluginData.assetTags.styles,
            ];
          }
          return htmlPluginData;
        },
      );
    });
  }
}
