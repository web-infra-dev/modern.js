import { join } from 'path';
import {
  debug,
  isFileExists,
  type CreateBuilderOptions,
  createContextByConfig,
  NormalizedSharedOutputConfig,
} from '@modern-js/builder-shared';
import { initHooks } from './initHooks';
import { ConfigValidator } from '../config/validate';
import { withDefaultConfig } from '../config/defaults';
import type { Context, BuilderConfig } from '../types';

/**
 * Create primary context.
 * It will be assembled into a normal context or a stub for testing as needed.
 * Usually it would be a pure function
 */
export function createPrimaryContext(
  options: Required<CreateBuilderOptions>,
  userBuilderConfig: BuilderConfig,
): Context {
  const builderConfig = withDefaultConfig(userBuilderConfig);
  const context = createContextByConfig(
    options,
    builderConfig.output as NormalizedSharedOutputConfig,
  );
  const configValidatingTask = Promise.resolve();

  return {
    ...context,
    hooks: initHooks(),
    configValidatingTask,
    config: { ...builderConfig },
    originalConfig: userBuilderConfig,
  };
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
