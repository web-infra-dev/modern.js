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
      const runtimeInEntry =
        compiler.options.optimization.runtimeChunk === false;
      // Read entrypoints during HTML generation, after chunks have been built.
      const getEntryRuntimeUrls = (publicPath: string) =>
        new Set(
          [...compilation.entrypoints.values()].flatMap(entrypoint =>
            [...entrypoint.getRuntimeChunk().files].flatMap(file => {
              const pathname = file.split('?', 1)[0];
              // HTML plugin implementations may URL-encode each path segment.
              return [
                `${publicPath}${pathname}`,
                `${publicPath}${pathname.split('/').map(encodeURIComponent).join('/')}`,
              ];
            }),
          ),
        );

      // Run before Rsbuild's HTML processing (stage 0), which inlines runtime
      // scripts and removes their src in production. Move runtime to body while
      // src still identifies it so entry execution waits for initial SSR data.
      hooks.alterAssetTagGroups.tap({ name: this.name, stage: -1 }, assets => {
        const headTags: typeof assets.headTags = [];
        const bodyTags: typeof assets.bodyTags = [];
        const entryRuntimeUrls = runtimeInEntry
          ? getEntryRuntimeUrls(assets.publicPath)
          : new Set<string>();

        const processScriptTag = (tag: (typeof assets.headTags)[0]) => {
          const { attributes } = tag;

          // Convert defer to async
          if (attributes && attributes.defer === true) {
            attributes.async = true;
            delete attributes.defer;
          }

          const src = attributes?.src;
          // Without a separate runtime, the entry itself starts the app. Move
          // that script after initial SSR data while keeping async loading.
          const isRuntimeChunk =
            typeof src === 'string' &&
            (runtimeInEntry
              ? entryRuntimeUrls.has(src.split(/[?#]/, 1)[0])
              : RUNTIME_CHUNK_REGEX.test(src));

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

      if (runtimeInEntry) {
        // Use final attributes after Rsbuild's HTML processing so preload CORS
        // and integrity settings match the script. Inlined entries need no hint.
        hooks.alterAssetTagGroups.tap({ name: this.name, stage: 1 }, assets => {
          const entryRuntimeUrls = getEntryRuntimeUrls(assets.publicPath);
          for (const tag of assets.bodyTags) {
            const src = tag.attributes?.src;
            if (
              tag.tagName !== 'script' ||
              typeof src !== 'string' ||
              !entryRuntimeUrls.has(src.split(/[?#]/, 1)[0])
            ) {
              continue;
            }

            const attributes: typeof tag.attributes = {
              rel:
                tag.attributes.type === 'module' ? 'modulepreload' : 'preload',
              href: src,
              ...(tag.attributes.type === 'module' ? {} : { as: 'script' }),
            };
            const resourceAttributes = [
              'crossorigin',
              'integrity',
              'referrerpolicy',
              'fetchpriority',
              'nonce',
            ] as const;
            for (const key of resourceAttributes) {
              if (tag.attributes[key] !== undefined) {
                attributes[key] = tag.attributes[key];
              }
            }
            if (
              assets.headTags.some(
                existing =>
                  existing.tagName === 'link' &&
                  ['rel', 'href', 'as', ...resourceAttributes].every(
                    key => existing.attributes?.[key] === attributes[key],
                  ),
              )
            ) {
              continue;
            }
            assets.headTags.push({
              tagName: 'link',
              voidTag: true,
              attributes,
            });
          }
          return assets;
        });
      }
    });
  }
}
