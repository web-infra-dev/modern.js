import { join } from 'path';
import { initHooks } from './createHook';
import { pick, STATUS, isFileExists } from '../shared';
import type { Context, BuilderOptions, BuilderContext } from '../types';
import { ConfigValidator } from 'src/config/validate';

export async function createContext({
  cwd,
  configPath,
  builderConfig,
}: Required<BuilderOptions>) {
  const hooks = initHooks();
  const status = STATUS.INITIAL;
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');
  const distPath = join(rootPath, 'dist');
  const cachePath = join(rootPath, 'node_modules', '.cache');
  const configValidatingTask = ConfigValidator.create().then(validator => {
    validator.validate(builderConfig, false);
  });

  // TODO some properties should be readonly
  const context: Context = {
    hooks,
    // TODO using setter to set status and log some performance info
    status,
    srcPath,
    rootPath,
    distPath,
    cachePath,
    configValidatingTask,
    // TODO should deep clone
    config: { ...builderConfig },
    originalConfig: builderConfig,
  };

  if (configPath) {
    context.configPath = configPath;
  }

  const tsconfigPath = join(rootPath, 'tsconfig.json');
  if (await isFileExists(tsconfigPath)) {
    context.tsconfigPath = tsconfigPath;
  }

  return context;
}

export function createPublicContext(
  context: Context,
): Readonly<BuilderContext> {
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
