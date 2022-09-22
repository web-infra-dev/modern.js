import { existsSync } from 'fs';
import { isAbsolute, join } from 'path';
import { initHooks } from './createHook';
import { pick, debug, isFileExists, getDistPath, deepFreezed } from '../shared';
import type {
  Context,
  BuilderOptions,
  BuilderContext,
  FinalConfig,
} from '../types';
import { processConfig } from '../config';

export function getAbsoluteDistPath(cwd: string, config: FinalConfig) {
  const root = getDistPath(config, 'root');
  return isAbsolute(root) ? root : join(cwd, root);
}

/**
 * Create primary context.
 * It will be assembled into a normal context or a stub for testing as needed.
 * Usually it would be a pure function
 */
export async function createPrimaryContext(
  options: Required<BuilderOptions>,
): Promise<Context> {
  const {
    cwd,
    configPath,
    builderConfig: userBuilderConfig,
    framework,
    validate,
  } = options;
  const config = await processConfig(userBuilderConfig, { validate });
  const hooks = initHooks();
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');
  const distPath = getAbsoluteDistPath(cwd, config);
  const cachePath = join(rootPath, 'node_modules', '.cache');

  // TODO some properties should be readonly
  const context: Context = {
    hooks,
    entry: options.entry,
    srcPath,
    rootPath,
    distPath,
    cachePath,
    framework,
    config,
    originalConfig: userBuilderConfig,
  };

  if (configPath && existsSync(configPath)) {
    context.configPath = configPath;
  }

  return context;
}

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext(
  options: Required<BuilderOptions>,
): Promise<Context> {
  debug('create context');

  const ctx = await createPrimaryContext(options);

  const tsconfigPath = join(ctx.rootPath, 'tsconfig.json');
  if (await isFileExists(tsconfigPath)) {
    ctx.tsconfigPath = tsconfigPath;
  }

  return ctx;
}

export function createPublicContext(
  context: Context,
): Readonly<BuilderContext> {
  const ctx = pick(context, [
    'entry',
    'srcPath',
    'rootPath',
    'distPath',
    'framework',
    'cachePath',
    'configPath',
    'tsconfigPath',
    'originalConfig',
  ]);
  return deepFreezed(ctx);
}
