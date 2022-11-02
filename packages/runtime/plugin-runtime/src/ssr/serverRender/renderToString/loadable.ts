import { ChunkExtractor } from '@loadable/server';
import { isCrossOrigin } from '../../utils';
import { getLoadableScripts } from '../utils';
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
    host,
    config = {},
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
    const fileType = extname(v.url!);

    if (fileType === 'js') {
      const props = [];
      const { crossorigin } = config;
      if (crossorigin && isCrossOrigin(v.url, host)) {
        props.push(
          `crossorigin="${crossorigin === true ? 'anonymous' : crossorigin}"`,
        );
      }
      chunksMap[fileType] += `<script src="${v.url}" ${props.join(
        ' ',
      )}></script>`;
    } else if (fileType === 'css') {
      chunksMap[fileType] += `<link href="${v.url}" rel="stylesheet" />`;
    }
  }

  return html;
};
