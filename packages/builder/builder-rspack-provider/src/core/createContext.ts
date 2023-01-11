import { join } from 'path';
import {
  isFileExists,
  createSharedBuilderContext,
  type CreateBuilderOptions,
} from '@modern-js/builder-shared';
import { initHooks } from './initHooks';
// import { ConfigValidator } from '../config/validate';
import { withDefaultConfig } from '../config/defaults';
import type { Context, BuilderConfig } from '../types';
import assert from 'assert';

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext(
  options: Required<CreateBuilderOptions>,
  userBuilderConfig: BuilderConfig,
): Promise<Context> {
  const builderConfig = withDefaultConfig(userBuilderConfig);
  const distPath = builderConfig.output?.distPath?.root;
  assert(distPath);
  const context = createSharedBuilderContext({
    ...options,
    distPath,
    bundlerType: 'rspack',
  });
  const configValidatingTask = Promise.resolve();
  // TODO: validator
  // const configValidatingTask =  ConfigValidator.create().then(validator => {
  //   // interrupt build if config is invalid.
  //   validator.validate(builderConfig, false);
  // });

  const tsconfigPath = join(context.rootPath, 'tsconfig.json');

  return {
    ...context,
    hooks: initHooks(),
    configValidatingTask,
    config: { ...builderConfig },
    originalConfig: userBuilderConfig,
    tsconfigPath: (await isFileExists(tsconfigPath)) ? tsconfigPath : undefined,
  };
}
