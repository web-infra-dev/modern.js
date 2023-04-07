import _ from '@modern-js/utils/lodash';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler } from 'webpack';
import { URL } from 'url';
import {
  HtmlInjectTag,
  HtmlInjectTagDescriptor,
  HtmlInjectTagUtils,
} from '../types';
import path from 'path';

export interface HtmlTagsPluginOptions {
  hash?: HtmlInjectTag['hash'];
  publicPath?: HtmlInjectTag['publicPath'];
  append?: HtmlInjectTag['append'];
  includes?: string[];
  tags?: HtmlInjectTagDescriptor[];
  HtmlPlugin: typeof HtmlWebpackPlugin;
}

export interface AdditionalContext {
  // eslint-disable-next-line @typescript-eslint/ban-types
  HtmlPlugin: Extract<HtmlTagsPluginOptions['HtmlPlugin'], Function>;
}

export type Context = Omit<HtmlTagsPluginOptions, keyof AdditionalContext> &
  AdditionalContext;

/** @see {@link https://developer.mozilla.org/en-US/docs/Glossary/Void_element} */
export const VOID_TAGS = [
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
export const HEAD_TAGS = [
  'title',
  'base',
  'link',
  'style',
  'meta',
  'script',
  'noscript',
  'template',
];

export const FILE_ATTRS = {
  link: 'href',
  script: 'src',
};

export const withPublicPath = (str: string, base: string) => {
  // The use of an absolute URL without a protocol is technically legal,
  // however it cannot be parsed as a URL instance.
  // Just return it.
  // e.g. str is //example.com/foo.js
  if (str.startsWith('//')) {
    return str;
  }

  // Only absolute url with hostname & protocol can be parsed into URL instance.
  // e.g. str is https://example.com/foo.js
  try {
    return new URL(str).toString();
  } catch {}

  // Or it should be a relative path.
  // Let's join the publicPath.
  // e.g. str is ./foo.js
  try {
    // `base` is a url with hostname & protocol.
    // e.g. base is https://example.com/static
    const url = new URL(base);
    url.pathname = path.posix.resolve(url.pathname, str);
    return url.toString();
  } catch {
    // without hostname & protocol.
    // e.g. base is /
    return path.posix.resolve(base, str);
  }
};

const withHash = (url: string, hash: string) => `${url}?${hash}`;

export class HtmlTagsPlugin {
  readonly name: string = 'HtmlTagsPlugin';

  meta: Record<string, string> = { plugin: this.name };

  ctx: Context;

  constructor(opts: HtmlTagsPluginOptions) {
    this.ctx = {
      append: true,
      ...opts,
    };
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, compilation => {
      const compilationHash = compilation.hash || '';
      const hooks = this.ctx.HtmlPlugin.getHooks(compilation);
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
            // apply publicPath and hash to filename attr.
            const attrs = { ...tag.attrs };
            const filenameTag = FILE_ATTRS[tag.tag as keyof typeof FILE_ATTRS];
            let filename = attrs[filenameTag];

            if (typeof filename === 'string') {
              const optPublicPath = tag.publicPath ?? this.ctx.publicPath;

              if (typeof optPublicPath === 'function') {
                filename = optPublicPath(filename, params.publicPath);
              } else if (typeof optPublicPath === 'string') {
                filename = withPublicPath(filename, optPublicPath);
              } else if (optPublicPath !== false) {
                filename = withPublicPath(filename, params.publicPath);
              }

              const optHash = tag.hash ?? this.ctx.hash;

              if (typeof optHash === 'function') {
                compilationHash.length &&
                  (filename = optHash(filename, compilationHash));
              } else if (typeof optHash === 'string') {
                optHash.length && (filename = withHash(filename, optHash));
              } else if (optHash === true) {
                compilationHash.length &&
                  (filename = withHash(filename, compilationHash));
              }

              attrs[filenameTag] = filename;
            }

            ret.push({
              tagName: tag.tag,
              attributes: attrs,
              meta: this.meta,
              voidTag: VOID_TAGS.includes(tag.tag),
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
        tags = _.sortBy(tags, tag => {
          let priority = 0;
          const head = tag.head ?? HEAD_TAGS.includes(tag.tag);
          const append = tag.append ?? this.ctx.append;
          priority += head ? -2 : 2;
          typeof append === 'boolean' && (priority += append ? 1 : -1);
          return priority;
        });

        const utils: HtmlInjectTagUtils = {
          outputName: params.outputName,
          publicPath: params.publicPath,
          hash: compilationHash,
        };
        for (const handler of handlers) {
          tags = handler(tags, utils) || tags;
        }

        // apply to html-webpack-plugin.
        const [headTags, bodyTags] = _.partition(
          tags,
          tag => tag.head ?? HEAD_TAGS.includes(tag.tag),
        );
        params.headTags = fromInjectTags(headTags);
        params.bodyTags = fromInjectTags(bodyTags);
        return params;
      });
    });
  }
}
