import { HtmlInjectTagOptions } from '@modern-js/builder-shared/src/types';
import assert from 'assert';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { HtmlTagObject } from 'html-webpack-plugin';
import { URL } from 'url';
import type { Compiler } from 'webpack';

export interface Options extends HtmlInjectTagOptions {
  htmlWebpackPlugin?: string | typeof HtmlWebpackPlugin;
  includes?: string[];
}

export interface AdditionalContext {
  hash: (path: string, hash: string) => string;
  publicPath: (path: string, publicPath: string) => string;
  includes?: string[];
  htmlWebpackPlugin: typeof HtmlWebpackPlugin;
}

export type Context = Omit<Options, keyof AdditionalContext> &
  AdditionalContext;

export const defaultOptions = {
  append: true,
  children: [],
  hash: false,
  publicPath: true,
  htmlWebpackPlugin: 'html-webpack-plugin',
  includes: [],
};

export const tagPathMapping = {
  script: 'src',
  link: 'href',
  meta: 'content',
} as const;

export const assetTagMapping = {
  script: 'scripts',
  link: 'styles',
  meta: 'meta',
} as const;

export const voidTags = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
];

export class HtmlTagsPlugin {
  name: string = 'modern-js::html-tags-plugin';

  ctx: Context;

  constructor(options: HtmlInjectTagOptions) {
    const opts = {
      ...defaultOptions,
      ...options,
    };
    const htmlWebpackPlugin =
      typeof opts.htmlWebpackPlugin === 'string'
        ? require(opts.htmlWebpackPlugin)
        : opts.htmlWebpackPlugin;
    const publicPath: Context['publicPath'] =
      // eslint-disable-next-line no-nested-ternary
      typeof opts.publicPath === 'function'
        ? opts.publicPath
        : opts.publicPath
        ? (url, base) => new URL(url, base).href
        : url => url;
    const hash: Context['hash'] =
      // eslint-disable-next-line no-nested-ternary
      typeof opts.hash === 'function'
        ? opts.hash
        : opts.hash
        ? (url, hash) => url.replace(/\.([^.]+?)$/, `.${hash}.$1`)
        : url => url;
    const children = opts.children.map(tag => {
      const pathProp = tag.path || tag.props?.[tagPathMapping[tag.type]];
      assert(
        typeof pathProp !== 'boolean',
        `expect "tag.path" or "tag.props.{src|href|content}" to be string,` +
          `but got ${typeof pathProp}.`,
      );
      return pathProp ? { ...tag, path: pathProp } : tag;
    });
    this.ctx = {
      ...opts,
      htmlWebpackPlugin,
      publicPath,
      hash,
      children,
    };
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, compilation => {
      const hooks = this.ctx.htmlWebpackPlugin.getHooks(compilation);
      hooks.alterAssetTags.tap(this.name, params => {
        if (this.ctx.includes?.includes(params.outputName)) {
          return params;
        }
        for (const tag of this.ctx.children) {
          // resolve path prop.
          let pathProp = tag.path;
          if (pathProp) {
            pathProp = this.ctx.publicPath(pathProp, params.publicPath);
            compilation.hash &&
              (pathProp = this.ctx.hash(pathProp, compilation.hash));
          }
          // apply path back to props.
          tag.props ||= {};
          pathProp && (tag.props[tagPathMapping[tag.type]] = pathProp);

          // apply tags to html-webpack-plugin
          const assetSet = params.assetTags[assetTagMapping[tag.type]];
          const tagObject: HtmlTagObject = {
            attributes: tag.props,
            voidTag: voidTags.includes(tag.type),
            tagName: tag.type,
            innerHTML: tag.children,
            meta: { plugin: this.name },
          };
          if (tag.append) {
            assetSet.push(tagObject);
          } else {
            assetSet.unshift(tagObject);
          }
        }
        return params;
      });
    });
  }
}
