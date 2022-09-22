import { resolve } from 'path';
import { ChunkExtractor } from '@loadable/server';
import { LOADABLE_STATS_FILE } from '@modern-js/utils';
import { RuntimeContext } from '../../core';

export type LoadableChunk = {
  filename?: string;
};
export function getLoadableChunks(
  context: RuntimeContext,
  jsx: React.ReactElement,
) {
  const { ssrContext } = context;
  if (!ssrContext) {
    // TODO: handle Error;
    throw new Error('has not ssrContext');
  }

  const loadableManifest = resolve(ssrContext.distDir, LOADABLE_STATS_FILE);
  if (!loadableManifest) {
    return [];
  }
  const extractor = new ChunkExtractor({
    statsFile: loadableManifest,
    entrypoints: [ssrContext.entryName],
  });
  extractor.collectChunks(jsx);
  const chunks = extractor.getChunkAssets(extractor.chunks) || [];
  return chunks;
}
