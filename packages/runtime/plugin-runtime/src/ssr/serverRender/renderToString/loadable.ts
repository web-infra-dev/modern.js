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

    for (const v of chunks) {
      const fileType = extname(v.url!).slice(1);
      const attributes: Record<string, any> = {};
      const { crossorigin, scriptLoading = 'defer' } = config;
      if (crossorigin) {
        attributes.crossorigin =
          crossorigin === true ? 'anonymous' : crossorigin;
      }

      switch (scriptLoading) {
        case 'defer':
          attributes.defer = true;
          break;
        case 'module':
          attributes.type = 'module';
          break;
        default:
      }

      if (fileType === 'js') {
        const jsChunkReg = new RegExp(`<script .*src="${v.url}".*>`);
        // we should't repeatly registe the script, if template already has it.
        if (!jsChunkReg.test(template)) {
          // `nonce` attrs just for script tag
          attributes.nonce = nonce;
          const attrsStr = attributesToString(attributes);
          chunksMap[fileType] += `<script${attrsStr} src="${v.url}"></script>`;
        }
      } else if (fileType === 'css') {
        const attrsStr = attributesToString(attributes);
        chunksMap[
          fileType
        ] += `<link${attrsStr} href="${v.url}" rel="stylesheet" />`;
      }
    }
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
