import {
  HtmlInjectTag,
  HtmlInjectTagDescriptor,
  HtmlInjectTagUtils,
} from '@modern-js/builder-shared';
import _ from '@modern-js/utils/lodash';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import { URL } from 'url';
import type { Compiler } from 'webpack';

export interface Options {
  hash?: HtmlInjectTag['hash'];
  publicPath?: HtmlInjectTag['publicPath'];
  append?: HtmlInjectTag['append'];
  htmlWebpackPlugin?: string | typeof HtmlWebpackPlugin;
  includes?: string[];
  tags?: HtmlInjectTagDescriptor[];
}

export interface AdditionalContext {
  // eslint-disable-next-line @typescript-eslint/ban-types
  htmlWebpackPlugin: Extract<Options['htmlWebpackPlugin'], Function>;
}

export type Context = Omit<Options, keyof AdditionalContext> &
  AdditionalContext;

/** @see {@link https://developer.mozilla.org/en-US/docs/Glossary/Void_element} */
export const voidTags = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];

/** @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head#see_also} */
export const headTags = [
  'title',
  'base',
  'link',
  'style',
  'meta',
  'script',
  'noscript',
  'template',
];

const withPublicPath = (url: string, base: string) => new URL(url, base).href;

const withHash = (url: string, hash: string) =>
  url.replace(/\.([^.]+?)$/, `.${hash}.$1`);

export class HtmlTagsPlugin {
  name: string = 'modern-js::html-tags-plugin';

  meta: Record<string, string> = { plugin: this.name };

  ctx: Context;

  constructor(opts: Options = {}) {
    const htmlWebpackPlugin =
      typeof opts.htmlWebpackPlugin === 'function'
        ? opts.htmlWebpackPlugin
        : require(opts.htmlWebpackPlugin || 'html-webpack-plugin');
    this.ctx = {
      append: true,
      ...opts,
      htmlWebpackPlugin,
    };
  }

  sortTags(tag: HtmlInjectTag) {
    const head = tag.head ?? headTags.includes(tag.tag);
    const append = tag.append ?? this.ctx.append;
    return (head ? -2 : 2) + (append ?? 0 ? 1 : -1);
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, compilation => {
      const compilationHash = compilation.hash || '';
      const hooks = this.ctx.htmlWebpackPlugin.getHooks(compilation);
      hooks.alterAssetTagGroups.tap(this.name, params => {
        // skip unmatched file and empty tag list.
        const includesCurrentFile =
          !this.ctx.includes || this.ctx.includes.includes(params.outputName);
        if (!includesCurrentFile || !this.ctx.tags?.length) {
          return params;
        }

        // convert tags between `HtmlInjectTag` and `HtmlWebpackPlugin.HtmlTagObject`.
        const fromWebpackTags = (
          tags: HtmlWebpackPlugin.HtmlTagObject[],
          override?: Partial<HtmlInjectTag>,
        ) => {
          const ret: HtmlInjectTag[] = [];
          for (const tag of tags) {
            ret.push({
              tag: tag.tagName,
              attrs: tag.attributes,
              children: tag.innerHTML,
              publicPath: false,
              ...override,
            });
          }
          return ret;
        };
        const fromInjectTags = (tags: HtmlInjectTag[]) => {
          const ret: HtmlWebpackPlugin.HtmlTagObject[] = [];
          for (const tag of tags) {
            let tagName = tag.tag;
            const optPublicPath = tag.publicPath ?? this.ctx.publicPath;
            if (typeof optPublicPath === 'function') {
              tagName = optPublicPath(tagName, params.publicPath);
            } else if (typeof optPublicPath === 'string') {
              tagName = withPublicPath(tagName, optPublicPath);
            } else if (optPublicPath !== false) {
              tagName = withPublicPath(tagName, params.publicPath);
            }
            const optHash = tag.hash ?? this.ctx.hash;
            if (typeof optHash === 'function') {
              tagName = optHash(tagName, compilationHash);
            } else if (typeof optHash === 'string') {
              tagName = withHash(tagName, optHash);
            } else if (optHash === true) {
              tagName = withHash(tagName, compilationHash);
            }
            ret.push({
              tagName,
              attributes: tag.attrs || {},
              meta: this.meta,
              voidTag: voidTags.includes(tag.tag),
              innerHTML: tag.children,
            });
          }
          return ret;
        };
        // create tag list from html-webpack-plugin and options.
        const [handlers, records] = _.partition(this.ctx.tags, _.isFunction);
        let tags = [
          ...fromWebpackTags(params.headTags, { head: true }),
          ...fromWebpackTags(params.bodyTags, { head: false }),
          ...records,
        ];
        // apply tag handler callbacks.
        tags = _.sortBy(tags, this.sortTags);
        const utils: HtmlInjectTagUtils = {
          outputName: params.outputName,
          publicPath: params.publicPath,
          hash: compilationHash,
        };
        for (const handler of handlers) {
          tags = handler(tags, utils) || tags;
        }

        // apply to html-webpack-plugin.
        const [headTags, bodyTags] = _.partition(tags, { head: true });
        params.headTags = fromInjectTags(headTags);
        params.bodyTags = fromInjectTags(bodyTags);
        return params;
      });
    });
  }
}
