import { resolve } from 'path';
import { ChunkExtractor } from '@loadable/server';
import { LOADABLE_STATS_FILE } from '@modern-js/utils';
import { RuntimeContext } from '../types';

export function getLoadableChunks({
  context,
  jsx,
}: {
  context: RuntimeContext;
  jsx: React.ReactElement;
}) {
  const ssrContext = context.ssrContext!;
  const loadableManifest = resolve(ssrContext.distDir, LOADABLE_STATS_FILE);
  if (!loadableManifest) {
    throw new Error("hasn't loadableManifest in handle loadable chunks");
  }
  const extractor = new ChunkExtractor({
    statsFile: loadableManifest,
    entrypoints: [ssrContext.entryName],
  });
  const collectedJsx = extractor.collectChunks(jsx);
  return {
    jsx: collectedJsx,
    chunkExtractor: extractor,
  };
}
