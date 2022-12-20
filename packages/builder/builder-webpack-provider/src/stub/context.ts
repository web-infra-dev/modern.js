import { existsSync } from 'fs';
import { join } from 'path';
import { createPrimaryContext } from '../core/createContext';
import type { StubBuilderOptions } from './builder';

export function createStubContext(options: Required<StubBuilderOptions>) {
  const context = createPrimaryContext(options, options.builderConfig);

  if (context.rootPath) {
    const tsconfigPath = join(context.rootPath, 'tsconfig.json');
    if (existsSync(tsconfigPath)) {
      context.tsconfigPath = tsconfigPath;
    }
  }

  return context;
}
