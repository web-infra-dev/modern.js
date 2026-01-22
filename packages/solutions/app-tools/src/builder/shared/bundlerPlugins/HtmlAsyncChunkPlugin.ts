import type { Rspack } from '@modern-js/builder';
import { RUNTIME_CHUNK_REGEX } from '@modern-js/builder';

export class HtmlAsyncChunkPlugin {
  name: string;

  htmlPlugin: typeof Rspack.HtmlRspackPlugin;

  constructor(htmlPlugin: typeof Rspack.HtmlRspackPlugin) {
    this.name = 'HtmlAsyncChunkPlugin';
    this.htmlPlugin = htmlPlugin;
  }

  apply(compiler: Rspack.Compiler) {
    compiler.hooks.compilation.tap(this.name, compilation => {
      const hooks = this.htmlPlugin.getCompilationHooks(compilation as any);

      hooks.alterAssetTagGroups.tap(this.name, assets => {
        const headTags: typeof assets.headTags = [];
        const bodyTags: typeof assets.bodyTags = [];

        const processScriptTag = (tag: (typeof assets.headTags)[0]) => {
          const { attributes } = tag;

          // Convert defer to async
          if (attributes && attributes.defer === true) {
            attributes.async = true;
            delete attributes.defer;
          }

          const src = attributes?.src as string | undefined;
          const isRuntimeChunk = src && RUNTIME_CHUNK_REGEX.test(src);

          return isRuntimeChunk ? bodyTags : headTags;
        };

        for (const tag of [...assets.headTags, ...assets.bodyTags]) {
          if (tag.tagName === 'script') {
            processScriptTag(tag).push(tag);
          } else {
            (assets.headTags.includes(tag) ? headTags : bodyTags).push(tag);
          }
        }

        return {
          ...assets,
          headTags,
          bodyTags,
        };
      });
    });
  }
}
