import { existsSync } from 'fs';
import { isAbsolute, join } from 'path';
import _ from '@modern-js/utils/lodash';
import { initHooks } from './createHook';
import { ConfigValidator } from '../config/validate';
import { withDefaultConfig } from '../config/defaults';
import {
  pick,
  STATUS,
  isFileExists,
  getDistPath,
  deepFreezed,
} from '../shared';
import type {
  Context,
  BuilderOptions,
  BuilderContext,
  BuilderConfig,
} from '../types';

export function getAbsoluteDistPath(cwd: string, config: BuilderConfig) {
  const root = getDistPath(config, 'root');
  return isAbsolute(root) ? root : join(cwd, root);
}

/**
 * Create primary context.
 * It will be assembled into a normal context or a stub for testing as needed.
 * Usually it would be a pure function
 */
export function createPrimaryContext(
  options: Required<BuilderOptions>,
): Context {
  const {
    cwd,
    configPath,
    builderConfig: userBuilderConfig,
    framework,
  } = options;
  const builderConfig = withDefaultConfig(_.cloneDeep(userBuilderConfig));
  const hooks = initHooks();
  const status = STATUS.INITIAL;
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');
  const distPath = getAbsoluteDistPath(cwd, builderConfig);
  const cachePath = join(rootPath, 'node_modules', '.cache');
  const configValidatingTask = Promise.resolve();

  // TODO some properties should be readonly
  const context: Context = {
    hooks,
    entry: options.entry,
    // TODO using setter to set status and log some performance info
    status,
    srcPath,
    rootPath,
    distPath,
    cachePath,
    framework,
    configValidatingTask,
    config: builderConfig,
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
  const ctx = createPrimaryContext(options);

  ctx.configValidatingTask = ConfigValidator.create().then(validator => {
    // interrupt build if config is invalid.
    validator.validate(options.builderConfig, false);
  });

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
