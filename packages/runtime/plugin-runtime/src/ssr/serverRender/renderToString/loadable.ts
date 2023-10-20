import { ChunkExtractor } from '@loadable/server';
import { ReactElement } from 'react';
import { attributesToString, getLoadableScripts } from '../utils';
import { SSRPluginConfig } from '../types';
import { RenderResult } from './type';
import type { Collector } from './render';

const extname = (uri: string): string => {
  if (typeof uri !== 'string' || !uri.includes('.')) {
    return '';
  }
  return `.${uri?.split('.').pop()}` || '';
};

class LoadableCollector implements Collector {
  private options: LoadableCollectorOptions;

  private extractor?: ChunkExtractor;

  constructor(options: LoadableCollectorOptions) {
    this.options = options;
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

  effect() {
    if (!this.extractor) {
      return;
    }
    const {
      result: { chunksMap },
      config,
      template,
      nonce,
    } = this.options;
    const { extractor } = this;
    const chunks = extractor.getChunkAssets(extractor.chunks);

    chunksMap.js = (chunksMap.js || '') + getLoadableScripts(extractor);

    const attributes = this.generateAttributes();

    for (const v of chunks) {
      if (!v.url) {
        continue;
      }
      const fileType = extname(v.url).slice(1);

      if (fileType === 'js') {
        const jsChunkReg = new RegExp(`<script .*src="${v.url}".*>`);
        if (!jsChunkReg.test(template)) {
          // scriptLoading just apply for script tag.
          const { scriptLoading = 'defer' } = config;
          switch (scriptLoading) {
            case 'defer':
              attributes.defer = true;
              break;
            case 'module':
              attributes.type = 'module';
              break;
            default:
          }
          // we should't repeatly registe the script, if template already has it.
          // `nonce` attrs just for script tag
          attributes.nonce = nonce;
          const attrsStr = attributesToString(attributes);
          chunksMap[fileType] += `<script${attrsStr} src="${v.url}"></script>`;
        }
      } else if (fileType === 'css') {
        const cssChunkReg = new RegExp(`<link .*href="${v.url}".*>`);
        if (!cssChunkReg.test(template)) {
          const attrsStr = attributesToString(attributes);
          chunksMap[
            fileType
          ] += `<link${attrsStr} href="${v.url}" rel="stylesheet" />`;
        }
      }
    }
  }

  private generateAttributes(): Record<string, any> {
    const { config } = this.options;
    const { crossorigin } = config;

    const attributes: Record<string, any> = {};

    if (crossorigin) {
      attributes.crossorigin = crossorigin === true ? 'anonymous' : crossorigin;
    }

    return attributes;
  }
}
export interface LoadableCollectorOptions {
  nonce?: string;
  stats?: Record<string, any>;
  template: string;
  config: SSRPluginConfig;
  entryName: string;
  result: RenderResult;
}
export function createLoadableCollector(options: LoadableCollectorOptions) {
  return new LoadableCollector(options);
}
