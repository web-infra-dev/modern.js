import { resolve } from 'path';
import React from 'react';
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
    return {
      jsx,
    };
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
