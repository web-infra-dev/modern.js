import { RenderHandler } from './type';

export const toHtml: RenderHandler = (jsx, renderer, next) => {
  return next(jsx);

  // const extractor = new ChunkExtractor({
  //   stats,
  //   entrypoints: [renderer.entryName],
  // });

  // const html = next(extractor.collectChunks(jsx));
  // const chunks = extractor.getChunkAssets(extractor.chunks);

  // chunksMap.js = (chunksMap.js || '') + getLoadableScripts(extractor);

  // for (const v of chunks) {
  //   const fileType = extname(v.url!).slice(1);

  //   if (fileType === 'js') {
  //     const props = [];
  //     const { crossorigin } = config;
  //     if (crossorigin && isCrossOrigin(v.url, host)) {
  //       props.push(
  //         `crossorigin="${crossorigin === true ? 'anonymous' : crossorigin}"`,
  //       );
  //     }
  //     chunksMap[fileType] += `<script src="${v.url}" ${props.join(
  //       ' ',
  //     )}></script>`;
  //   } else if (fileType === 'css') {
  //     chunksMap[fileType] += `<link href="${v.url}" rel="stylesheet" />`;
  //   }
  // }
};
