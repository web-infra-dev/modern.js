import { join } from 'path';
import { initHooks } from './createHook';
import { pick, STATUS, isFileExists } from '../shared';
import type { CreateBuilderOptions } from './createBuilder';
import type { Context, WebBuilderContext } from '../types';

export async function createContext(options: CreateBuilderOptions) {
  const cwd = options.cwd || process.cwd();
  const config = options.builderConfig || {};
  const hooks = initHooks();
  const status = STATUS.INITIAL;
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');
  const distPath = join(rootPath, 'dist');
  const cachePath = join(rootPath, 'node_modules', '.cache');

  // TODO some properties should be readonly
  const context: Context = {
    hooks,
    // TODO using setter to set status and log some performance info
    status,
    srcPath,
    rootPath,
    distPath,
    cachePath,
    configPath: options.configPath,
    // TODO should deep clone
    config: { ...config },
    originalConfig: config,
  };

  if (options.configPath) {
    context.configPath = options.configPath;
  }

  const tsconfigPath = join(rootPath, 'tsconfig.json');
  if (await isFileExists(tsconfigPath)) {
    context.tsconfigPath = tsconfigPath;
  }

  return context;
}

export function createPublicContext(
  context: Context,
): Readonly<WebBuilderContext> {
  return Object.freeze(
    pick(context, [
      'srcPath',
      'rootPath',
      'distPath',
      'cachePath',
      'configPath',
      'tsconfigPath',
      'originalConfig',
    ]),
  );
}
