<<<<<<< HEAD
import { pick } from './pick';
import { deepFreezed } from './utils';
=======
import { pick, deepFreezed } from './utils';
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
import type { BuilderContext } from './types';

export function createPublicContext(
  context: BuilderContext,
): Readonly<BuilderContext> {
  const ctx = pick(context, [
    'entry',
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
