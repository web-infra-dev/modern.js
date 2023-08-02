/**
 * @license
 * Copyright 2018 Google Inc.
 * https://github.com/vuejs/preload-webpack-plugin/blob/master/src/lib/does-chunk-belong-to-html.js
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ChunkGroup } from './extractChunks';
import { Chunk, Compilation } from 'webpack';
import { PreloadOrPreFetchOption } from '../../../types';
// @ts-expect-error
import EntryPoint from 'webpack/lib/Entrypoint';
import { BeforeAssetTagGenerationHtmlPluginData } from './type';

interface DoesChunkBelongToHtmlOptions {
  chunk: Chunk;
  compilation?: Compilation;
  htmlPluginData: BeforeAssetTagGenerationHtmlPluginData;
  pluginOptions?: PreloadOrPreFetchOption;
}

function recursiveChunkGroup(chunkGroup: ChunkGroup): string | undefined {
  if (chunkGroup instanceof EntryPoint) {
    return chunkGroup.name;
  } else {
    const [chunkParent] = chunkGroup.getParents();
    return recursiveChunkGroup(chunkParent);
  }
}

function recursiveChunkEntryName(chunk: Chunk): string | undefined {
  const [chunkGroup] = chunk.groupsIterable;
  return recursiveChunkGroup(chunkGroup);
}

// modify from html-webpack-plugin/index.js `filterChunks`
function isChunksFiltered(
  chunkName: string,
  includeChunks?: string[] | 'all',
  excludeChunks?: string[],
): boolean {
  // Skip if the chunks should be filtered and the given chunk was not added explicity
  if (Array.isArray(includeChunks) && includeChunks.indexOf(chunkName) === -1) {
    return false;
  }
  // Skip if the chunks should be filtered and the given chunk was excluded explicity
  if (Array.isArray(excludeChunks) && excludeChunks.indexOf(chunkName) !== -1) {
    return false;
  }
  // Add otherwise
  return true;
}

export function doesChunkBelongToHtml({
  chunk,
  htmlPluginData,
}: DoesChunkBelongToHtmlOptions): boolean {
  // find the chunk belongs
  const chunkName = recursiveChunkEntryName(chunk) as string;

  const { options } = htmlPluginData.plugin;

  return isChunksFiltered(chunkName, options?.chunks, options?.excludeChunks);
}
