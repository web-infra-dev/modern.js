import { ChunkExtractor } from '@loadable/server';
import { RuntimeContext } from '../types';

export function getLoadableChunks({
  context,
  jsx,
}: {
  context: RuntimeContext;
  jsx: React.ReactElement;
}) {
  const { loadableStats, entryName } = context.ssrContext!;
  if (!loadableStats) {
    return {
      jsx,
    };
  }
  const extractor = new ChunkExtractor({
    stats: loadableStats,
    entrypoints: [entryName],
  });
  const collectedJsx = extractor.collectChunks(jsx);
  return {
    jsx: collectedJsx,
    chunkExtractor: extractor,
  };
}
