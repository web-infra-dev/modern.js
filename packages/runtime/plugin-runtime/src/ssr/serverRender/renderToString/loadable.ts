import { ChunkExtractor } from '@loadable/server';
import { attributesToString, getLoadableScripts } from '../utils';
import { RenderHandler } from './type';

const extname = (uri: string): string => {
  if (typeof uri !== 'string' || !uri.includes('.')) {
    return '';
  }
  return `.${uri?.split('.').pop()}` || '';
};

export const toHtml: RenderHandler = (jsx, renderer, next) => {
  const {
    stats,
    result: { chunksMap },
    config = {},
    nonce,
  } = renderer;

  if (!stats || chunksMap.js) {
    return next(jsx);
  }

  const extractor = new ChunkExtractor({
    stats,
    entrypoints: [renderer.entryName],
  });

  const html = next(extractor.collectChunks(jsx));
  const chunks = extractor.getChunkAssets(extractor.chunks);

  chunksMap.js = (chunksMap.js || '') + getLoadableScripts(extractor);

  for (const v of chunks) {
    const fileType = extname(v.url!).slice(1);
    const attributes: Record<string, any> = {};
    const { crossorigin, scriptLoading = 'defer' } = config;
    if (crossorigin) {
      attributes.crossorigin = crossorigin === true ? 'anonymous' : crossorigin;
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
      // `nonce` attrs just for script tag
      attributes.nonce = nonce;
      const attrsStr = attributesToString(attributes);
      chunksMap[fileType] += `<script${attrsStr} src="${v.url}"></script>`;
    } else if (fileType === 'css') {
      const attrsStr = attributesToString(attributes);
      chunksMap[
        fileType
      ] += `<link${attrsStr} href="${v.url}" rel="stylesheet" />`;
    }
  }

  return html;
};
