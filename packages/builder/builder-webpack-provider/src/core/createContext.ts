import { existsSync } from 'fs';
import { isAbsolute, join } from 'path';
import {
  debug,
  deepFreezed,
  isFileExists,
  type CreateBuilderOptions,
} from '@modern-js/builder-shared';
import { initHooks } from './initHooks';
import { ConfigValidator } from '../config/validate';
import { withDefaultConfig } from '../config/defaults';
import { getDistPath } from '../shared';
import type { Context, BuilderConfig, NormalizedConfig } from '../types';

export function getAbsoluteDistPath(cwd: string, config: NormalizedConfig) {
  const root = getDistPath(config, 'root');
  return isAbsolute(root) ? root : join(cwd, root);
}

/**
 * Create primary context.
 * It will be assembled into a normal context or a stub for testing as needed.
 * Usually it would be a pure function
 */
export function createPrimaryContext(
  options: Required<CreateBuilderOptions>,
  userBuilderConfig: BuilderConfig,
): Context {
  const { cwd, target, configPath, framework } = options;
  const builderConfig = withDefaultConfig(userBuilderConfig);
  const hooks = initHooks();
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');
  // Config has not been modified after merging the default values. Regard it as normalized config...
  const distPath = getAbsoluteDistPath(cwd, builderConfig as NormalizedConfig);
  const cachePath = join(rootPath, 'node_modules', '.cache');
  const configValidatingTask = Promise.resolve();

  // TODO some properties should be readonly
  const context: Context = {
    hooks,
    entry: options.entry,
    target,
    srcPath,
    rootPath,
    distPath,
    cachePath,
    framework,
    configValidatingTask,
    // TODO should deep clone
    config: { ...builderConfig },
    originalConfig: deepFreezed(userBuilderConfig),
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
  options: Required<CreateBuilderOptions>,
  builderConfig: BuilderConfig,
): Promise<Context> {
  debug('create context');

  const ctx = createPrimaryContext(options, builderConfig);

  ctx.configValidatingTask = ConfigValidator.create().then(validator => {
    // interrupt build if config is invalid.
    validator.validate(builderConfig, false);
  });

  const tsconfigPath = join(ctx.rootPath, 'tsconfig.json');
  if (await isFileExists(tsconfigPath)) {
    ctx.tsconfigPath = tsconfigPath;
  }

  return ctx;
}
