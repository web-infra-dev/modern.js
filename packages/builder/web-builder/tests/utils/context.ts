import path from 'path';
import { getDistPath } from '../../src/core/createContext';
import { initHooks } from '../../src/core/createHook';
import { STATUS } from '../../src/shared';
import type { Context } from '../../src/types';
import type { StubBuilderOptions } from './builder';

export function createStubContext({
  cwd,
  configPath,
  builderConfig,
}: Required<StubBuilderOptions>) {
  const hooks = initHooks();
  const status = STATUS.INITIAL;
  const rootPath = cwd;
  const srcPath = path.join(rootPath, 'src');
  const distPath = getDistPath(cwd, builderConfig);
  const cachePath = path.join(rootPath, 'node_modules', '.cache');
  const configValidatingTask = Promise.resolve();

  const context: Context = {
    hooks,
    status,
    srcPath,
    rootPath,
    distPath,
    cachePath,
    configValidatingTask,
    config: { ...builderConfig },
    originalConfig: builderConfig,
  };

  if (configPath) {
    context.configPath = configPath;
  }

  context.tsconfigPath = path.join(rootPath, 'tsconfig.json');

  return context;
}
