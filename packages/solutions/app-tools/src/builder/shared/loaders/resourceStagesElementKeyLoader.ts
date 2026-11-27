import path from 'path';
import type { Rspack } from '@modern-js/builder';
import { ELEMENT_STAGES } from '../resourceStages/config';
import { getElementDeclarationKey } from '../resourceStages/elementKey';
import { parseStageDeclarations } from '../resourceStages/parse';

export interface ResourceStagesElementKeyLoaderOptions {
  appDirectory: string;
}

const API_NAME = 'stagedImport';

/**
 * Adds the declaration key to `stagedImport.viewport(() => import('./A'))` and
 * `stagedImport.interaction(...)`:
 * `stagedImport.viewport(() => import('./A'), "1a2b3c4d")`. The runtime then
 * prefetches the chunks and CSS the build mapped to the key, instead of
 * calling the loader to find its chunks.
 */
function loader(
  this: Rspack.LoaderContext<ResourceStagesElementKeyLoaderOptions>,
  source: string,
) {
  if (!source.includes(API_NAME)) {
    return source;
  }
  const { appDirectory } = this.getOptions();
  const file = path.relative(appDirectory, this.resourcePath);
  const { declarations } = parseStageDeclarations(
    source,
    file,
    new Set(ELEMENT_STAGES),
  );
  const positions = declarations
    .filter(item => item.argumentEnd !== undefined)
    .map(item => ({
      at: item.argumentEnd!,
      text: `, ${JSON.stringify(getElementDeclarationKey(file, item.line))}`,
    }))
    .sort((a, b) => b.at - a.at);
  if (!positions.length) {
    return source;
  }
  let bytes = Buffer.from(source);
  for (const { at, text } of positions) {
    bytes = Buffer.concat([
      bytes.subarray(0, at),
      Buffer.from(text),
      bytes.subarray(at),
    ]);
  }
  return bytes.toString();
}

export default loader;
