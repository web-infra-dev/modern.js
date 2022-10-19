import { pick } from './pick';
import { deepFreezed } from './utils';
import type { BuilderContext } from './types';

export function createPublicContext(
  context: BuilderContext,
): Readonly<BuilderContext> {
  const ctx = pick(context, [
    'entry',
    'target',
    'srcPath',
    'rootPath',
    'distPath',
    'devServer',
    'framework',
    'cachePath',
    'configPath',
    'tsconfigPath',
  ]);
  return deepFreezed(ctx);
}
