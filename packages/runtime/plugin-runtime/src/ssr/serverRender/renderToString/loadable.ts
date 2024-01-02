import { type ChunkAsset, ChunkExtractor } from '@loadable/server';
import { ReactElement } from 'react';
import { attributesToString, checkIsNode } from '../utils';
import { SSRPluginConfig, RenderResult } from '../types';
import type { Collector } from './render';

const extname = (uri: string): string => {
  if (typeof uri !== 'string' || !uri.includes('.')) {
    return '';
  }
  return `.${uri?.split('.').pop()}` || '';
};

const generateChunks = (chunks: ChunkAsset[], ext: string) =>
  chunks
    .filter(chunk => Boolean(chunk.url))
    .filter(chunk => extname(chunk.url!).slice(1) === ext);

const checkIsInline = (
  chunk: ChunkAsset,
  enableInline: boolean | RegExp | undefined,
) => {
  // only production apply the inline config
  if (process.env.NODE_ENV === 'production') {
    if (enableInline instanceof RegExp) {
      return enableInline.test(chunk.url!);
    } else {
      return Boolean(enableInline);
    }
  } else {
    return false;
  }
};

const readAsset = async (chunk: ChunkAsset) => {
  // working node env
  const fs = await import('fs/promises');
  const path = await import('path');

  // only working in 'production' env
  // we need ensure the assetsDir is same as ssr bundles.
  const filepath = path.resolve(__dirname, chunk.filename!);

  return fs.readFile(filepath, 'utf-8');
};

class LoadableCollector implements Collector {
  private options: LoadableCollectorOptions;

  private extractor?: ChunkExtractor;

  constructor(options: LoadableCollectorOptions) {
    this.options = options;
  }

  private get existsAssets(): string[] | undefined {
    const { routeManifest, entryName } = this.options;
    return routeManifest?.routeAssets?.[entryName]?.assets;
  }

  collect(comopnent: ReactElement): ReactElement {
    const { stats, entryName } = this.options;

    if (!stats) {
      return comopnent;
    }

    this.extractor = new ChunkExtractor({
      stats,
      entrypoints: [entryName],
    });

    return this.extractor.collectChunks(comopnent);
  }

  async effect() {
    if (!this.extractor) {
      return;
    }
    const { extractor } = this;

    const chunks = extractor.getChunkAssets(extractor.chunks);

    const scriptChunks = generateChunks(chunks, 'js');
    const styleChunks = generateChunks(chunks, 'css');

    this.emitLoadableScripts(extractor);
    await this.emitScriptAssets(scriptChunks);
    await this.emitStyleAssets(styleChunks);
  }

  private emitLoadableScripts(extractor: ChunkExtractor) {
    const check = (scripts: string) =>
      (scripts || '').includes('__LOADABLE_REQUIRED_CHUNKS___ext');

    const scripts = extractor.getScriptTags();

    if (!check(scripts)) {
      return;
    }

    const {
      result: { chunksMap },
    } = this.options;

    const s = scripts
      .split('</script>')
      // The first two scripts are essential for Loadable.
      .slice(0, 2)
      .map(i => `${i}</script>`)
      .join('');

    chunksMap.js += s;
  }

  private async emitScriptAssets(chunks: ChunkAsset[]) {
    const { template, config, nonce, result } = this.options;
    const { chunksMap } = result;
    const { scriptLoading = 'defer', enableInlineScripts } = config;

    const scriptLoadingAtr = {
      defer: scriptLoading === 'defer' ? true : undefined,
      type: scriptLoading === 'module' ? 'module' : undefined,
      async: scriptLoading === 'async' ? true : undefined,
    };

    const attributes = attributesToString(
      this.generateAttributes({
        nonce,
        ...scriptLoadingAtr,
      }),
    );

    const scripts = await Promise.all(
      chunks
        .filter(chunk => {
          const jsChunkReg = new RegExp(`<script .*src="${chunk.url!}".*>`);
          return (
            !jsChunkReg.test(template) &&
            !this.existsAssets?.includes(chunk.path!)
          );
        })
        .map(async chunk => {
          const script = `<script${attributes} src="${chunk.url}"></script>`;

          // only in node read assets
          if (checkIsNode() && checkIsInline(chunk, enableInlineScripts)) {
            return readAsset(chunk)
              .then(content => `<script>${content}</script>`)
              .catch(_ => {
                // if read file occur error, we should return script tag to import js assets.
                return script;
              });
          } else {
            return script;
          }
        }),
    );
    // filter empty string;
    chunksMap.js += scripts.filter(script => Boolean(script)).join('');
  }

  private async emitStyleAssets(chunks: ChunkAsset[]) {
    const {
      template,
      result: { chunksMap },
      config: { enableInlineStyles },
    } = this.options;

    const atrributes = attributesToString(this.generateAttributes());

    const css = await Promise.all(
      chunks
        .filter(chunk => {
          const cssChunkReg = new RegExp(`<link .*href="${chunk.url!}".*>`);

          return (
            !cssChunkReg.test(template) &&
            !this.existsAssets?.includes(chunk.path!)
          );
        })
        .map(async chunk => {
          const link = `<link${atrributes} href="${chunk.url!}" rel="stylesheet" />`;

          // only in node read asserts
          if (checkIsNode() && checkIsInline(chunk, enableInlineStyles)) {
            return readAsset(chunk)
              .then(content => `<style>${content}</style>`)
              .catch(_ => {
                // if read file occur error, we should return link to import css assets.
                return link;
              });
          } else {
            return link;
          }
        }),
    );

    // filter empty string;
    chunksMap.css += css.filter(css => Boolean(css)).join('');
  }

  private generateAttributes(
    extraAtr: Record<string, any> = {},
  ): Record<string, any> {
    const { config } = this.options;
    const { crossorigin } = config;

    const attributes: Record<string, any> = {};

    if (crossorigin) {
      attributes.crossorigin = crossorigin === true ? 'anonymous' : crossorigin;
    }

    return {
      ...attributes,
      ...extraAtr,
    };
  }
}
export interface LoadableCollectorOptions {
  nonce?: string;
  stats?: Record<string, any>;
  routeManifest?: Record<string, any>;
  template: string;
  config: SSRPluginConfig;
  entryName: string;
  result: RenderResult;
}
export function createLoadableCollector(options: LoadableCollectorOptions) {
  return new LoadableCollector(options);
}
